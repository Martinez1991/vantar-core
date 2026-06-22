import "reflect-metadata";
import { config as loadEnv } from "dotenv";
import { join } from "path";
import { DataSource } from "typeorm";
import {
  DEMO_TENANT_ID,
  DEMO_TENANT_NAME,
  DEMO_TENANT_SLUG,
} from "../common/tenant/tenant.constants";
import * as bcrypt from "bcryptjs";
import { Role, User } from "../auth/user.entity";
import { Criticality, Environment, Project } from "../projects/project.entity";
import {
  Questionnaire,
  QuestionnaireStatus,
} from "../questionnaires/questionnaire.entity";
import { getTemplate } from "../questionnaires/questionnaire-catalog";
import { score, type Answers } from "../questionnaires/scoring";
import { randomUUID } from "crypto";
import {
  ProjectRequirement,
  RequirementStatus,
  RequirementTemplate,
} from "../requirements/requirement.entity";
import { MaturitySnapshot } from "../analytics/maturity-snapshot.entity";
import { Risk, RiskStatus } from "../risks/risk.entity";
import { Tenant } from "../tenants/tenant.entity";
import {
  ELEMENT_TYPE_LABEL,
  STRIDE_BY_TYPE,
  STRIDE_MITIGATION,
} from "../threat-modeling/stride-catalog";
import {
  ThreatModel,
  type DfdNode,
} from "../threat-modeling/threat-model.entity";
import { Threat, ThreatStatus } from "../threat-modeling/threat.entity";
import { buildTypeOrmOptions } from "./typeorm.options";

loadEnv({ path: join(__dirname, "../../../../.env") });
loadEnv(); // .env local de apps/api, se houver

const seedProjects: Partial<Project>[] = [
  {
    name: "PagFlow — Gateway de Pagamentos",
    owner: "Equipe Payments",
    criticality: Criticality.Critica,
    environment: Environment.Cloud,
    dataClasses: ["PCI", "PII"],
    openRisks: 4,
    securityScore: 72,
  },
  {
    name: "Onboarding Digital de Contas",
    owner: "Squad KYC",
    criticality: Criticality.Alta,
    environment: Environment.Cloud,
    dataClasses: ["PII", "Dados financeiros"],
    openRisks: 2,
    securityScore: 81,
  },
  {
    name: "Portal do Cliente",
    owner: "Web Platform",
    criticality: Criticality.Media,
    environment: Environment.Hibrido,
    dataClasses: ["PII"],
    openRisks: 1,
    securityScore: 88,
  },
];

async function main() {
  const ds = new DataSource({
    ...buildTypeOrmOptions(),
    // Schema é criado pelas migrations (migrate.ts); o seed apenas insere dados.
    synchronize: false,
  });
  await ds.initialize();

  const tenantRepo = ds.getRepository(Tenant);
  const projectRepo = ds.getRepository(Project);
  const riskRepo = ds.getRepository(Risk);

  let tenant = await tenantRepo.findOne({ where: { id: DEMO_TENANT_ID } });
  if (!tenant) {
    tenant = tenantRepo.create({
      id: DEMO_TENANT_ID,
      slug: DEMO_TENANT_SLUG,
      name: DEMO_TENANT_NAME,
      plan: "community",
    });
    await tenantRepo.save(tenant);
    console.log(`Tenant demo criado: ${tenant.name} (${tenant.id})`);
  } else {
    console.log(`Tenant demo já existe: ${tenant.name}`);
  }

  // --- Usuário demo (owner do tenant demo) ---
  const userRepo = ds.getRepository(User);
  const demoEmail = "admin@vantar.local";
  if (!(await userRepo.findOne({ where: { email: demoEmail } }))) {
    await userRepo.save(
      userRepo.create({
        tenantId: DEMO_TENANT_ID,
        email: demoEmail,
        name: "Admin Vantar",
        passwordHash: await bcrypt.hash("vantar123", 10),
        role: Role.Owner,
      }),
    );
    console.log(`Usuário demo criado: ${demoEmail} / vantar123 (owner)`);
  } else {
    console.log(`Usuário demo já existe: ${demoEmail}`);
  }

  const existing = await projectRepo.count({
    where: { tenantId: DEMO_TENANT_ID },
  });
  if (existing > 0) {
    console.log(`Projetos já existem (${existing}). Nada a semear.`);
  } else {
    for (const data of seedProjects) {
      const project = projectRepo.create({ ...data, tenantId: DEMO_TENANT_ID });
      await projectRepo.save(project);
      console.log(`  + projeto: ${project.name}`);
    }
    console.log(`${seedProjects.length} projetos semeados.`);
  }

  // --- Riscos (RF-RSK) ---
  const riskCount = await riskRepo.count({ where: { tenantId: DEMO_TENANT_ID } });
  if (riskCount > 0) {
    console.log(`Riscos já existem (${riskCount}). Nada a semear.`);
  } else {
    const projects = await projectRepo.find({ where: { tenantId: DEMO_TENANT_ID } });
    const byName = (needle: string) =>
      projects.find((p) => p.name.toLowerCase().includes(needle.toLowerCase()));

    const seeds: Array<{ project?: Project; data: Partial<Risk> }> = [
      {
        project: byName("PagFlow"),
        data: {
          title: "IDOR no endpoint de extrato",
          description: "Falta de verificação de propriedade permite acessar extratos de outros clientes.",
          category: "Information Disclosure (STRIDE)",
          likelihood: 4,
          impact: 5,
          status: RiskStatus.Open,
        },
      },
      {
        project: byName("PagFlow"),
        data: {
          title: "Ausência de rate limiting no PIX",
          description: "Endpoint de cobrança PIX sem limite de taxa, exposto a abuso/DoS.",
          category: "Denial of Service (STRIDE)",
          likelihood: 3,
          impact: 4,
          status: RiskStatus.Mitigating,
          mitigationPlan: "Aplicar rate limiting por cliente no API Gateway e WAF.",
          mitigationOwner: "Equipe Plataforma",
          mitigationDueDate: "2026-08-15",
        },
      },
      {
        project: byName("Onboarding"),
        data: {
          title: "Upload de documento sem validação de tipo",
          description: "Aceita qualquer mime-type; risco de upload malicioso.",
          category: "Tampering (STRIDE)",
          likelihood: 3,
          impact: 3,
          status: RiskStatus.Open,
        },
      },
      {
        project: byName("Portal"),
        data: {
          title: "Cookies de sessão sem flag Secure",
          description: "Cookies trafegam sem Secure/HttpOnly em alguns fluxos.",
          category: "Information Disclosure (STRIDE)",
          likelihood: 2,
          impact: 2,
          status: RiskStatus.Accepted,
          acceptedBy: "Ana Costa (AppSec)",
          acceptanceJustification: "Baixo impacto; correção agendada para o próximo hardening sprint.",
          acceptedAt: new Date(),
        },
      },
    ];

    let created = 0;
    for (const s of seeds) {
      if (!s.project) continue;
      const risk = riskRepo.create({
        ...s.data,
        tenantId: DEMO_TENANT_ID,
        projectId: s.project.id,
      });
      await riskRepo.save(risk);
      created += 1;
      console.log(`  + risco: ${risk.title}`);
    }

    // Recalcula openRisks dos projetos afetados (open + mitigating).
    for (const p of projects) {
      const open = await riskRepo
        .createQueryBuilder("r")
        .where("r.tenantId = :t AND r.projectId = :p", { t: DEMO_TENANT_ID, p: p.id })
        .andWhere("r.status IN (:...s)", { s: [RiskStatus.Open, RiskStatus.Mitigating] })
        .getCount();
      await projectRepo.update({ id: p.id }, { openRisks: open });
    }
    console.log(`${created} riscos semeados.`);
  }

  // --- Questionário demo (RF-QST) ---
  const qnRepo = ds.getRepository(Questionnaire);
  const qnCount = await qnRepo.count({ where: { tenantId: DEMO_TENANT_ID } });
  if (qnCount > 0) {
    console.log(`Questionários já existem (${qnCount}). Nada a semear.`);
  } else {
    const projects = await projectRepo.find({ where: { tenantId: DEMO_TENANT_ID } });
    const pagflow = projects.find((p) => p.name.toLowerCase().includes("pagflow"));
    const template = getTemplate("owasp-top10");
    if (pagflow && template) {
      const answers: Answers = {
        a01: { value: "yes" },
        a02: { value: "yes" },
        a03: { value: "yes" },
        a04: { value: "partial" },
        a05: { value: "partial" },
        a06: { value: "yes" },
        a07: { value: "no" },
        a08: { value: "partial" },
        a09: { value: "yes" },
        a10: { value: "na" },
      };
      const s = score(template, answers);
      const qn = qnRepo.create({
        tenantId: DEMO_TENANT_ID,
        projectId: pagflow.id,
        templateId: template.id,
        status: QuestionnaireStatus.Completed,
        answers,
        securityScore: s.securityScore,
        maturityLevel: s.maturityLevel,
        riskLevel: s.riskLevel,
        completedAt: new Date(),
      });
      await qnRepo.save(qn);
      await projectRepo.update({ id: pagflow.id }, { securityScore: s.securityScore });
      console.log(
        `  + questionário: ${template.name} em ${pagflow.name} (score ${s.securityScore}, ${s.maturityLevel})`,
      );
    }
  }

  // --- Threat model demo (RF-TM) ---
  const tmRepo = ds.getRepository(ThreatModel);
  const threatRepo = ds.getRepository(Threat);
  const tmCount = await tmRepo.count({ where: { tenantId: DEMO_TENANT_ID } });
  if (tmCount > 0) {
    console.log(`Threat models já existem (${tmCount}). Nada a semear.`);
  } else {
    const projects = await projectRepo.find({ where: { tenantId: DEMO_TENANT_ID } });
    const pagflow = projects.find((p) => p.name.toLowerCase().includes("pagflow"));
    if (pagflow) {
      const cliente: DfdNode = { id: randomUUID(), type: "external", name: "Cliente" };
      const api: DfdNode = { id: randomUUID(), type: "process", name: "API de Pagamentos" };
      const banco: DfdNode = { id: randomUUID(), type: "datastore", name: "Banco de Transações" };
      const model = await tmRepo.save(
        tmRepo.create({
          tenantId: DEMO_TENANT_ID,
          projectId: pagflow.id,
          name: "Threat Model — Fluxo de pagamento",
          dfd: {
            nodes: [cliente, api, banco],
            flows: [
              { id: randomUUID(), from: cliente.id, to: api.id, name: "Inicia pagamento", protocol: "HTTPS" },
              { id: randomUUID(), from: api.id, to: banco.id, name: "Persiste transação", protocol: "TLS" },
            ],
          },
        }),
      );

      const threats: Threat[] = [];
      for (const node of [cliente, api, banco]) {
        for (const category of STRIDE_BY_TYPE[node.type]) {
          threats.push(
            threatRepo.create({
              tenantId: DEMO_TENANT_ID,
              threatModelId: model.id,
              elementId: node.id,
              elementName: `${node.name} (${ELEMENT_TYPE_LABEL[node.type]})`,
              category,
              title: `${category} em ${node.name}`,
              mitigation: STRIDE_MITIGATION[category],
              status: ThreatStatus.Open,
            }),
          );
        }
      }
      await threatRepo.save(threats);
      console.log(`  + threat model: ${model.name} (${threats.length} ameaças STRIDE)`);
    }
  }

  // --- Biblioteca de requisitos (RF-REQ) ---
  const tplRepo = ds.getRepository(RequirementTemplate);
  const reqRepo = ds.getRepository(ProjectRequirement);
  const tplCount = await tplRepo.count({ where: { tenantId: DEMO_TENANT_ID } });
  if (tplCount > 0) {
    console.log(`Biblioteca de requisitos já existe (${tplCount}). Nada a semear.`);
  } else {
    const library = [
      { code: "REQ-AUTH-001", title: "MFA para papéis privilegiados", framework: "ASVS", control: "V2 Authentication", category: "Authentication", description: "Exigir MFA para AppSec/admin (RS-IAM-003)." },
      { code: "REQ-AC-001", title: "Controle de acesso deny-by-default", framework: "ASVS", control: "V4 Access Control", category: "Access Control", description: "Autorização server-side com menor privilégio." },
      { code: "REQ-CRYPTO-001", title: "TLS 1.2+ em todo tráfego", framework: "ASVS", control: "V9 Communications", category: "Cryptography", description: "Criptografia em trânsito sem fallback inseguro." },
      { code: "REQ-LOG-001", title: "Trilha de auditoria imutável", framework: "NIST", control: "AU-9", category: "Logging", description: "Logs append-only de ações sensíveis." },
      { code: "REQ-VAL-001", title: "Validação de entrada e saída", framework: "ASVS", control: "V5 Validation", category: "Validation", description: "Prevenir injeção e XSS por validação/encoding." },
      { code: "REQ-SECRETS-001", title: "Gestão de segredos via cofre", framework: "CIS", control: "CIS 16", category: "Secrets", description: "Proibido segredo em código/env plano." },
    ];
    const saved = await tplRepo.save(
      library.map((l) => tplRepo.create({ ...l, tenantId: DEMO_TENANT_ID })),
    );
    console.log(`${saved.length} requisitos na biblioteca.`);

    const projects = await projectRepo.find({ where: { tenantId: DEMO_TENANT_ID } });
    const pagflow = projects.find((p) => p.name.toLowerCase().includes("pagflow"));
    if (pagflow) {
      const auth = saved.find((s) => s.code === "REQ-AUTH-001")!;
      const crypto = saved.find((s) => s.code === "REQ-CRYPTO-001")!;
      await reqRepo.save([
        reqRepo.create({
          tenantId: DEMO_TENANT_ID,
          projectId: pagflow.id,
          templateId: crypto.id,
          code: crypto.code,
          title: crypto.title,
          description: crypto.description,
          framework: crypto.framework,
          control: crypto.control,
          status: RequirementStatus.Approved,
          approvedBy: "admin@vantar.local",
          approvedAt: new Date(),
          source: "library",
        }),
        reqRepo.create({
          tenantId: DEMO_TENANT_ID,
          projectId: pagflow.id,
          templateId: auth.id,
          code: auth.code,
          title: auth.title,
          description: auth.description,
          framework: auth.framework,
          control: auth.control,
          status: RequirementStatus.Proposed,
          source: "library",
        }),
      ]);
      console.log("  + 2 requisitos aplicados ao PagFlow (1 aprovado, 1 proposto).");
    }
  }

  // --- Snapshots de maturidade retroativos (RF-DSH-002) ---
  const snapRepo = ds.getRepository(MaturitySnapshot);
  const snapCount = await snapRepo.count({ where: { tenantId: DEMO_TENANT_ID } });
  if (snapCount > 0) {
    console.log(`Snapshots já existem (${snapCount}). Nada a semear.`);
  } else {
    const series = [
      { d: 21, score: 48, open: 6, crit: 2 },
      { d: 18, score: 54, open: 6, crit: 2 },
      { d: 15, score: 60, open: 5, crit: 1 },
      { d: 12, score: 64, open: 5, crit: 1 },
      { d: 9, score: 68, open: 4, crit: 1 },
      { d: 6, score: 70, open: 4, crit: 1 },
      { d: 3, score: 72, open: 3, crit: 1 },
      { d: 0, score: 74, open: 3, crit: 1 },
    ];
    const rows = series.map((s) => {
      const dt = new Date();
      dt.setDate(dt.getDate() - s.d);
      return snapRepo.create({
        tenantId: DEMO_TENANT_ID,
        capturedAt: dt.toISOString().slice(0, 10),
        avgSecurityScore: s.score,
        projectCount: 3,
        openRisks: s.open,
        criticalRisks: s.crit,
        requirementsApproved: 2,
        requirementsTotal: 3,
      });
    });
    await snapRepo.save(rows);
    console.log(`${rows.length} snapshots de maturidade semeados (tendência 48→74).`);
  }

  await ds.destroy();
  console.log("Seed concluído.");
}

main().catch((err) => {
  console.error("Falha no seed:", err);
  process.exit(1);
});
