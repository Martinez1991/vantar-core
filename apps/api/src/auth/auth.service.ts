import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { authenticator } from "otplib";
import { IsNull, MoreThan, Repository } from "typeorm";
import { Tenant } from "../tenants/tenant.entity";
import { AuthUser } from "./auth.types";
import { CreateUserDto, LoginDto, RegisterDto } from "./dto/auth.dto";
import { RefreshToken } from "./refresh-token.entity";
import { Role, User } from "./user.entity";

const REFRESH_TTL_MS = Number(process.env.REFRESH_TTL_DAYS ?? 7) * 24 * 60 * 60 * 1000;

export type Session = {
  accessToken: string;
  refreshToken: string;
  user: ReturnType<AuthService["profile"]>;
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Tenant) private readonly tenants: Repository<Tenant>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<Session> {
    const email = dto.email.toLowerCase().trim();
    if (await this.users.findOne({ where: { email } })) {
      throw new ConflictException("E-mail já cadastrado.");
    }
    const tenant = await this.tenants.save(
      this.tenants.create({
        name: dto.tenantName,
        slug: await this.uniqueSlug(dto.tenantName),
        plan: "community",
      }),
    );
    const user = await this.users.save(
      this.users.create({
        tenantId: tenant.id,
        email,
        name: dto.name,
        passwordHash: await bcrypt.hash(dto.password, 10),
        role: Role.Owner,
      }),
    );
    return this.issueSession(user);
  }

  /** Login com verificação de MFA quando ativo (RS-IAM-003). */
  async login(dto: LoginDto): Promise<Session | { mfaRequired: true }> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.users.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException("Credenciais inválidas.");
    }
    if (user.mfaEnabled) {
      if (!dto.code) return { mfaRequired: true };
      if (!this.verifyTotp(user, dto.code)) {
        throw new UnauthorizedException("Código MFA inválido.");
      }
    }
    return this.issueSession(user);
  }

  async refresh(rawToken: string): Promise<Session> {
    const tokenHash = this.hash(rawToken);
    const record = await this.refreshTokens.findOne({
      where: { tokenHash, revokedAt: IsNull(), expiresAt: MoreThan(new Date()) },
    });
    if (!record || record.revokedAt) {
      throw new UnauthorizedException("Refresh token inválido ou expirado.");
    }
    record.revokedAt = new Date(); // rotação
    await this.refreshTokens.save(record);
    const user = await this.users.findOne({ where: { id: record.userId } });
    if (!user) throw new UnauthorizedException();
    return this.issueSession(user);
  }

  async logout(rawToken: string): Promise<{ ok: true }> {
    const record = await this.refreshTokens.findOne({
      where: { tokenHash: this.hash(rawToken) },
    });
    if (record && !record.revokedAt) {
      record.revokedAt = new Date();
      await this.refreshTokens.save(record);
    }
    return { ok: true };
  }

  async me(auth: AuthUser) {
    const user = await this.users.findOne({ where: { id: auth.userId } });
    if (!user) throw new UnauthorizedException();
    return this.profile(user);
  }

  /* ---------------- MFA (RS-IAM-003) ---------------- */

  async mfaSetup(userId: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const secret = authenticator.generateSecret();
    user.mfaSecret = secret;
    user.mfaEnabled = false; // só ativa após verificar o código
    await this.users.save(user);
    return { secret, otpauth: authenticator.keyuri(user.email, "Vantar", secret) };
  }

  async mfaEnable(userId: string, code: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user?.mfaSecret) {
      throw new BadRequestException("Configure o MFA antes de ativar.");
    }
    if (!this.verifyTotp(user, code)) {
      throw new BadRequestException("Código inválido.");
    }
    user.mfaEnabled = true;
    await this.users.save(user);
    return { enabled: true };
  }

  async mfaDisable(userId: string) {
    await this.users.update(
      { id: userId },
      { mfaEnabled: false, mfaSecret: null },
    );
    return { enabled: false };
  }

  /* ---------------- Gestão de usuários ---------------- */

  async createUser(tenantId: string, dto: CreateUserDto) {
    const email = dto.email.toLowerCase().trim();
    if (await this.users.findOne({ where: { email } })) {
      throw new ConflictException("E-mail já cadastrado.");
    }
    const user = await this.users.save(
      this.users.create({
        tenantId,
        email,
        name: dto.name,
        passwordHash: await bcrypt.hash(dto.password, 10),
        role: dto.role,
      }),
    );
    return this.profile(user);
  }

  async listUsers(tenantId: string) {
    const users = await this.users.find({
      where: { tenantId },
      order: { createdAt: "ASC" },
    });
    return users.map((u) => this.profile(u));
  }

  /* ---------------- internos ---------------- */

  private verifyTotp(user: User, code: string): boolean {
    return !!user.mfaSecret && authenticator.verify({ token: code, secret: user.mfaSecret });
  }

  private async issueSession(user: User): Promise<Session> {
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    });
    const raw = randomBytes(48).toString("hex");
    await this.refreshTokens.save(
      this.refreshTokens.create({
        userId: user.id,
        tenantId: user.tenantId,
        tokenHash: this.hash(raw),
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      }),
    );
    return { accessToken, refreshToken: raw, user: this.profile(user) };
  }

  private hash(raw: string): string {
    return createHash("sha256").update(raw).digest("hex");
  }

  private profile(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      mfaEnabled: user.mfaEnabled,
    };
  }

  private async uniqueSlug(name: string): Promise<string> {
    const base =
      name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) || "tenant";
    let slug = base;
    let n = 1;
    while (await this.tenants.findOne({ where: { slug } })) {
      slug = `${base}-${++n}`;
    }
    return slug;
  }
}
