import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

// Ciclo de vida do risco (RF-RSK-003..005).
export enum RiskStatus {
  Open = "open", // identificado, sem mitigação
  Mitigating = "mitigating", // com plano de mitigação em andamento
  Accepted = "accepted", // aceite formal de risco
  Closed = "closed", // mitigado/encerrado
}

/**
 * Risco de um projeto. Likelihood e Impact (1–5) derivam o nível via P×I.
 * Carrega tenant_id (RS-IAM-006) e referência ao projeto.
 */
@Entity("risks")
@Index(["tenantId", "projectId"])
export class Risk {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column("uuid")
  tenantId!: string;

  @Index()
  @Column("uuid")
  projectId!: string;

  @Column()
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  // Categoria livre (ex.: STRIDE — Spoofing/Tampering/…) ou tipo de ameaça.
  @Column({ type: "varchar", nullable: true })
  category!: string | null;

  // --- Risco inerente (P×I) ---
  @Column({ type: "int", default: 3 })
  likelihood!: number;

  @Column({ type: "int", default: 3 })
  impact!: number;

  @Column({ type: "varchar", default: RiskStatus.Open })
  status!: RiskStatus;

  // --- Mitigação (RF-RSK-003) ---
  @Column({ type: "text", nullable: true })
  mitigationPlan!: string | null;

  @Column({ type: "varchar", nullable: true })
  mitigationOwner!: string | null;

  @Column({ type: "date", nullable: true })
  mitigationDueDate!: string | null;

  // --- Risco residual (RF-RSK-004) ---
  @Column({ type: "int", nullable: true })
  residualLikelihood!: number | null;

  @Column({ type: "int", nullable: true })
  residualImpact!: number | null;

  // --- Aceite formal (RF-RSK-005) ---
  @Column({ type: "varchar", nullable: true })
  acceptedBy!: string | null;

  @Column({ type: "text", nullable: true })
  acceptanceJustification!: string | null;

  @Column({ type: "timestamptz", nullable: true })
  acceptedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
