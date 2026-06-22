import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { Stride } from "./stride-catalog";

export enum ThreatStatus {
  Open = "open",
  Mitigated = "mitigated",
  Accepted = "accepted",
}

/**
 * Ameaça STRIDE associada a um elemento do DFD (RF-TM-002). Pode ser
 * promovida a um Risco (riskId) ligando Threat Modeling ao Risk Assessment.
 */
@Entity("threats")
@Index(["tenantId", "threatModelId"])
export class Threat {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column("uuid")
  tenantId!: string;

  @Index()
  @Column("uuid")
  threatModelId!: string;

  // Elemento do DFD ao qual a ameaça se aplica (id e nome denormalizado).
  @Column({ type: "varchar", nullable: true })
  elementId!: string | null;

  @Column({ type: "varchar", nullable: true })
  elementName!: string | null;

  @Column({ type: "varchar" })
  category!: Stride;

  @Column()
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "text", nullable: true })
  mitigation!: string | null;

  @Column({ type: "varchar", default: ThreatStatus.Open })
  status!: ThreatStatus;

  // Link para o Risco gerado a partir desta ameaça (RF-TM-003 → Risk).
  @Column({ type: "uuid", nullable: true })
  riskId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
