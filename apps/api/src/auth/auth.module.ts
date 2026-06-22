import { Module } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TenantContextInterceptor } from "../common/tenant/tenant-context.interceptor";
import { Tenant } from "../tenants/tenant.entity";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { getJwtKeys } from "./jwt-keys";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { RefreshToken } from "./refresh-token.entity";
import { RolesGuard } from "./roles.guard";
import { User } from "./user.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Tenant, RefreshToken]),
    // Access token RS256 de curta duração (RS-IAM-002).
    JwtModule.registerAsync({
      useFactory: () => {
        const { privateKey, publicKey } = getJwtKeys();
        return {
          privateKey,
          publicKey,
          signOptions: {
            algorithm: "RS256",
            expiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
          },
          verifyOptions: { algorithms: ["RS256"] },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    // Seta o GUC de tenant por requisição (base do RLS).
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
  ],
})
export class AuthModule {}
