import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

// Domínio de Project Portfolio (§2.1).
export enum Criticality {
  Baixa = "Baixa",
  Media = "Média",
  Alta = "Alta",
  Critica = "Crítica",
}

export enum Environment {
  Cloud = "Cloud",
  OnPremise = "On-Premise",
  Hibrido = "Híbrido",
}

/**
 * Projeto — RF-PRJ-001..007. Toda linha carrega `tenantId` (RS-IAM-006);
 * o índice composto reflete que as buscas são sempre escopadas por tenant.
 */
@Entity("projects")
@Index(["tenantId", "archived"])
export class Project {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column("uuid")
  tenantId!: string;

  @Column()
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column()
  owner!: string;

  @Column({ type: "varchar", default: Criticality.Media })
  criticality!: Criticality;

  @Column({ type: "varchar", default: Environment.Cloud })
  environment!: Environment;

  // Categorias de dados processados — RF-PRJ-004 (PII, PCI, …).
  @Column({ type: "text", array: true, default: () => "'{}'" })
  dataClasses!: string[];

  @Column({ type: "text", array: true, default: () => "'{}'" })
  tags!: string[];

  @Column({ type: "int", default: 0 })
  openRisks!: number;

  @Column({ type: "int", default: 0 })
  securityScore!: number;

  @Column({ type: "boolean", default: false })
  archived!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
