import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { ElementType } from "./stride-catalog";

export enum ThreatModelStatus {
  Draft = "draft",
  Review = "review",
  Approved = "approved",
}

// Elementos e fluxos do DFD (RF-TM-001) — persistidos como jsonb.
export type DfdNode = { id: string; type: ElementType; name: string };
export type DfdFlow = {
  id: string;
  from: string;
  to: string;
  name: string;
  protocol?: string;
};
export type Dfd = { nodes: DfdNode[]; flows: DfdFlow[] };

// Comentário colaborativo lido do ThreatAtlas (RF-TM-006, pull bidirecional).
export type AtlasComment = {
  author: string;
  body: string;
  createdAt?: string;
  element?: string;
};

@Entity("threat_models")
@Index(["tenantId", "projectId"])
export class ThreatModel {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column("uuid")
  tenantId!: string;

  @Index()
  @Column("uuid")
  projectId!: string;

  @Column()
  name!: string;

  @Column({ type: "varchar", default: ThreatModelStatus.Draft })
  status!: ThreatModelStatus;

  @Column({ type: "jsonb", default: () => `'{"nodes":[],"flows":[]}'` })
  dfd!: Dfd;

  @Column({ type: "int", default: 1 })
  version!: number;

  // --- Sincronização com OWASP ThreatAtlas (RF-TM-006) ---
  @Column({ type: "varchar", nullable: true })
  threatAtlasRef!: string | null;

  @Column({ type: "timestamptz", nullable: true })
  syncedAt!: Date | null;

  // Comentários/aprovações lidos de volta do ThreatAtlas (pull bidirecional).
  @Column({ type: "jsonb", nullable: true })
  atlasComments!: AtlasComment[] | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
