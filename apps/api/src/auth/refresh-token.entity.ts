import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

/**
 * Refresh token (RS-IAM-002) — armazenado como hash SHA-256 (alta entropia),
 * com expiração e revogação para rotação. O token em claro só existe no cliente.
 */
@Entity("refresh_tokens")
export class RefreshToken {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column("uuid")
  userId!: string;

  @Column("uuid")
  tenantId!: string;

  @Index({ unique: true })
  @Column()
  tokenHash!: string;

  @Column({ type: "timestamptz" })
  expiresAt!: Date;

  @Column({ type: "timestamptz", nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
