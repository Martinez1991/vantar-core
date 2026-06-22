import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

/**
 * Trilha de auditoria imutável (RS-AUD-001/002): quem, o quê, quando, de onde.
 * Append-only — o role do app só tem INSERT/SELECT (sem UPDATE/DELETE).
 */
@Entity("audit_logs")
@Index(["tenantId", "createdAt"])
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column("uuid")
  tenantId!: string;

  @Column({ type: "uuid", nullable: true })
  userId!: string | null;

  @Column({ type: "varchar", nullable: true })
  userEmail!: string | null;

  @Column()
  action!: string; // ex.: "POST /api/risks/:id/accept"

  @Column()
  method!: string;

  @Column()
  path!: string;

  @Column({ type: "int" })
  statusCode!: number;

  @Column({ type: "varchar", nullable: true })
  ip!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
