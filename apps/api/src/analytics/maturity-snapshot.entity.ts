import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

/**
 * Snapshot diário da postura de segurança do tenant — série temporal para a
 * evolução de maturidade (RF-DSH-002). Um registro por tenant por dia.
 */
@Entity("maturity_snapshots")
@Index(["tenantId", "capturedAt"], { unique: true })
export class MaturitySnapshot {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column("uuid")
  tenantId!: string;

  @Column({ type: "date" })
  capturedAt!: string;

  @Column({ type: "int", default: 0 })
  avgSecurityScore!: number;

  @Column({ type: "int", default: 0 })
  projectCount!: number;

  @Column({ type: "int", default: 0 })
  openRisks!: number;

  @Column({ type: "int", default: 0 })
  criticalRisks!: number;

  @Column({ type: "int", default: 0 })
  requirementsApproved!: number;

  @Column({ type: "int", default: 0 })
  requirementsTotal!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
