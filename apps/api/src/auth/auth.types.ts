import { Role } from "./user.entity";

/** Conteúdo do JWT e do req.user após autenticação. */
export interface AuthUser {
  userId: string;
  tenantId: string;
  email: string;
  role: Role;
}

export interface JwtPayload {
  sub: string;
  tenantId: string;
  email: string;
  role: Role;
}
