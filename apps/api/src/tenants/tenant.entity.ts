import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

export type TenantPlan = "community" | "enterprise";

/**
 * Tenant — unidade de isolamento multi-tenant (RF-GOV-001).
 * O `plan` governa limites de Open Core (ex.: 5 projetos na Community).
 */
@Entity("tenants")
export class Tenant {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  slug!: string;

  @Column()
  name!: string;

  @Column({ type: "varchar", default: "community" })
  plan!: TenantPlan;

  @CreateDateColumn()
  createdAt!: Date;
}
