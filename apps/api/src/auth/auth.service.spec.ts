import { ConflictException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import { mockRepo } from "../test-utils";
import { AuthService } from "./auth.service";
import { Role } from "./user.entity";

function make() {
  const users = mockRepo();
  const tenants = mockRepo();
  const refreshTokens = mockRepo();
  const jwt = { signAsync: jest.fn(async () => "access.jwt.token") };
  const service = new AuthService(users as any, tenants as any, refreshTokens as any, jwt as any);
  return { service, users, tenants, refreshTokens, jwt };
}

const hash = (pw: string) => bcrypt.hashSync(pw, 4);

describe("AuthService", () => {
  it("register cria tenant + owner e emite access + refresh", async () => {
    const { service, users, tenants, refreshTokens } = make();
    users.findOne.mockResolvedValue(null);
    tenants.findOne.mockResolvedValue(null);
    tenants.save.mockResolvedValue({ id: "tenant1", slug: "acme" });
    users.save.mockResolvedValue({ id: "user1", tenantId: "tenant1", email: "a@b.com", name: "A", role: Role.Owner, mfaEnabled: false });
    const s: any = await service.register({ tenantName: "Acme", name: "A", email: "a@b.com", password: "12345678" });
    expect(s.accessToken).toBe("access.jwt.token");
    expect(s.refreshToken).toHaveLength(96); // 48 bytes hex
    expect(s.user.role).toBe(Role.Owner);
    expect(refreshTokens.save).toHaveBeenCalled();
  });

  it("register com e-mail existente → Conflict", async () => {
    const { service, users } = make();
    users.findOne.mockResolvedValue({ id: "u" });
    await expect(
      service.register({ tenantName: "A", name: "A", email: "a@b.com", password: "12345678" }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("login: senha errada → Unauthorized", async () => {
    const { service, users } = make();
    users.findOne.mockResolvedValue({ id: "u1", passwordHash: hash("certa"), mfaEnabled: false });
    await expect(service.login({ email: "a@b.com", password: "errada" })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("login: sucesso emite sessão", async () => {
    const { service, users } = make();
    users.findOne.mockResolvedValue({ id: "u1", tenantId: "t1", email: "a@b.com", name: "A", role: Role.Developer, passwordHash: hash("vantar123"), mfaEnabled: false });
    const s: any = await service.login({ email: "a@b.com", password: "vantar123" });
    expect(s.accessToken).toBeDefined();
    expect(s.refreshToken).toBeDefined();
  });

  it("login: MFA ativo sem código → mfaRequired", async () => {
    const { service, users } = make();
    users.findOne.mockResolvedValue({ id: "u1", passwordHash: hash("vantar123"), mfaEnabled: true, mfaSecret: "S" });
    const res = await service.login({ email: "a@b.com", password: "vantar123" });
    expect(res).toEqual({ mfaRequired: true });
  });

  it("refresh: rotaciona e revoga o registro antigo", async () => {
    const { service, refreshTokens, users } = make();
    const record: any = { id: "rt1", userId: "u1", revokedAt: null, expiresAt: new Date(Date.now() + 1e6) };
    refreshTokens.findOne.mockResolvedValue(record);
    users.findOne.mockResolvedValue({ id: "u1", tenantId: "t1", email: "a@b.com", name: "A", role: Role.Owner, mfaEnabled: false });
    const s: any = await service.refresh("tok");
    expect(s.accessToken).toBeDefined();
    expect(record.revokedAt).toBeInstanceOf(Date); // revogado
  });

  it("refresh: token inválido → Unauthorized", async () => {
    const { service, refreshTokens } = make();
    refreshTokens.findOne.mockResolvedValue(null);
    await expect(service.refresh("x")).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("MFA: setup gera segredo e enable valida o código TOTP", async () => {
    const { service, users } = make();
    const user: any = { id: "u1", email: "a@b.com", mfaSecret: null, mfaEnabled: false };
    users.findOne.mockResolvedValue(user);
    const setup = await service.mfaSetup("u1");
    expect(setup.secret).toBeTruthy();
    expect(setup.otpauth).toContain("otpauth://");
    const code = authenticator.generate(user.mfaSecret);
    const res = await service.mfaEnable("u1", code);
    expect(res).toEqual({ enabled: true });
    expect(user.mfaEnabled).toBe(true);
  });

  it("createUser duplicado → Conflict", async () => {
    const { service, users } = make();
    users.findOne.mockResolvedValue({ id: "u" });
    await expect(
      service.createUser("t1", { name: "A", email: "a@b.com", password: "12345678", role: Role.Viewer }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("listUsers mapeia perfis", async () => {
    const { service, users } = make();
    users.find.mockResolvedValue([{ id: "u1", email: "a@b.com", name: "A", role: Role.Owner, tenantId: "t1", mfaEnabled: false }]);
    const list = await service.listUsers("t1");
    expect(list[0]).not.toHaveProperty("passwordHash");
    expect(list[0].email).toBe("a@b.com");
  });
});
