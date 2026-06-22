import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

/**
 * Item da biblioteca de requisitos de segurança (reutilizável entre projetos)
 * — RF-REQ-001/002. Vinculado a um framework e controle (ASVS/NIST/CIS).
 */
@Entity("requirement_templates")
export class RequirementTemplate {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column("uuid")
  tenantId!: string;

  @Column()
  code!: string; // ex.: REQ-AUTH-001

  @Column()
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column()
  framework!: string; // ASVS | NIST | CIS | OWASP

  @Column()
  control!: string; // ex.: ASVS V2.1.1

  @Column({ type: "varchar", nullable: true })
  category!: string | null; // ex.: Authentication

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

export enum RequirementStatus {
  Proposed = "proposed",
  Approved = "approved",
  Rejected = "rejected",
  Implemented = "implemented",
}

/**
 * Requisito aplicado a um projeto, com fluxo de aprovação AppSec (RF-REQ-004)
 * e rastreabilidade opcional a uma ameaça (threatId) — ameaça → requisito.
 */
@Entity("project_requirements")
@Index(["tenantId", "projectId"])
export class ProjectRequirement {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column("uuid")
  tenantId!: string;

  @Index()
  @Column("uuid")
  projectId!: string;

  // Template de origem (null se requisito ad-hoc).
  @Column({ type: "uuid", nullable: true })
  templateId!: string | null;

  @Column()
  code!: string;

  @Column()
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column()
  framework!: string;

  @Column()
  control!: string;

  @Column({ type: "varchar", default: RequirementStatus.Proposed })
  status!: RequirementStatus;

  // Aprovação (RF-REQ-004)
  @Column({ type: "varchar", nullable: true })
  approvedBy!: string | null;

  @Column({ type: "timestamptz", nullable: true })
  approvedAt!: Date | null;

  @Column({ type: "text", nullable: true })
  rejectionReason!: string | null;

  // Rastreabilidade ameaça → requisito (RF-TM-003 / RF-REQ-005 manual).
  @Column({ type: "uuid", nullable: true })
  threatId!: string | null;

  @Column({ type: "varchar", nullable: true })
  source!: string | null; // "library" | "custom" | "threat"

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
