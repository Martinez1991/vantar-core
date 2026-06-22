import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { Answers } from "./scoring";

export enum QuestionnaireStatus {
  Draft = "draft",
  Completed = "completed",
}

/**
 * Assessment de um framework aplicado a um projeto — RF-QST. As respostas
 * vivem em jsonb (Record<questionId, Answer>); os scores são denormalizados
 * para listagem/dashboard e recalculados a cada save.
 */
@Entity("questionnaires")
@Index(["tenantId", "projectId"])
export class Questionnaire {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column("uuid")
  tenantId!: string;

  @Index()
  @Column("uuid")
  projectId!: string;

  // Referência ao template do catálogo (ex.: "owasp-top10").
  @Column()
  templateId!: string;

  @Column({ type: "varchar", default: QuestionnaireStatus.Draft })
  status!: QuestionnaireStatus;

  @Column({ type: "jsonb", default: () => "'{}'" })
  answers!: Answers;

  // --- Computados (RF-QST-003) ---
  @Column({ type: "int", default: 0 })
  securityScore!: number;

  @Column({ type: "varchar", default: "Inicial" })
  maturityLevel!: string;

  @Column({ type: "varchar", default: "critical" })
  riskLevel!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: "timestamptz", nullable: true })
  completedAt!: Date | null;
}
