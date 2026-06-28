import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

/**
 * Papéis (RBAC — RS-IAM-005). Hierarquia de privilégio decrescente.
 * - owner/admin: gerem o tenant e usuários.
 * - appsec: aprovam riscos e operam segurança (papel AppSec/SecInfo).
 * - developer: criam/editam projetos, questionários e riscos.
 * - viewer: somente leitura (auditoria/compliance).
 */
export enum Role {
  Owner = "owner",
  Admin = "admin",
  AppSec = "appsec",
  Developer = "developer",
  Viewer = "viewer",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column("uuid")
  tenantId!: string;

  // Email é a credencial de login — único globalmente.
  @Index({ unique: true })
  @Column()
  email!: string;

  @Column()
  name!: string;

  // Hash bcrypt — nunca a senha em claro (RS-CRY-003).
  @Column()
  passwordHash!: string;

  @Column({ type: "varchar", default: Role.Developer })
  role!: Role;

  // --- MFA TOTP (RS-IAM-003) ---
  @Column({ type: "varchar", nullable: true })
  mfaSecret!: string | null;

  @Column({ type: "boolean", default: false })
  mfaEnabled!: boolean;

  // --- Anti brute-force / account lockout (RS-IAM-004, SEC-03) ---
  // Tentativas de login malsucedidas consecutivas; zera no sucesso.
  @Column({ type: "int", default: 0 })
  failedLoginAttempts!: number;

  // Quando preenchido e no futuro, o login é recusado até essa data.
  @Column({ type: "timestamptz", nullable: true })
  lockedUntil!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
