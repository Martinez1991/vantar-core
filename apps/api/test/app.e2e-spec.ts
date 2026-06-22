import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { initializeTransactionalContext } from "typeorm-transactional";
import request from "supertest";
import { AppModule } from "../src/app.module";

/**
 * E2E: app real (controllers + guards + interceptors) contra Postgres com
 * migrations + RLS. O app conecta como vantar_app (APP_DATABASE_URL), então o
 * isolamento multi-tenant é exercido de verdade. (Núcleo aberto — sem módulos EE.)
 */
describe("Vantar Core API (e2e)", () => {
  let app: INestApplication;
  let http: any;

  const project = {
    name: "Projeto E2E",
    owner: "Squad",
    criticality: "Média",
    environment: "Cloud",
  };

  beforeAll(async () => {
    initializeTransactionalContext();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api", { exclude: ["health", "metrics"] });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    http = app.getHttpServer();
  });

  afterAll(async () => {
    await app?.close();
  });

  it("health é público", async () => {
    await request(http).get("/health").expect(200);
  });

  it("fluxo: registra tenant A, cria projeto e lista", async () => {
    const reg = await request(http)
      .post("/api/auth/register")
      .send({ tenantName: "Empresa A", name: "Ana", email: "ownerA@e2e.com", password: "senha12345" })
      .expect(201);
    const tokenA = reg.body.accessToken;
    expect(tokenA).toBeDefined();

    await request(http)
      .post("/api/projects")
      .set("Authorization", `Bearer ${tokenA}`)
      .send(project)
      .expect(201);

    const list = await request(http)
      .get("/api/projects")
      .set("Authorization", `Bearer ${tokenA}`)
      .expect(200);
    expect(list.body).toHaveLength(1);
  });

  it("RLS: tenant B não enxerga dados do tenant A", async () => {
    const reg = await request(http)
      .post("/api/auth/register")
      .send({ tenantName: "Empresa B", name: "Bob", email: "ownerB@e2e.com", password: "senha12345" })
      .expect(201);
    const list = await request(http)
      .get("/api/projects")
      .set("Authorization", `Bearer ${reg.body.accessToken}`)
      .expect(200);
    expect(list.body).toHaveLength(0);
  });

  it("auth: senha errada → 401", async () => {
    await request(http)
      .post("/api/auth/login")
      .send({ email: "ownerA@e2e.com", password: "errada" })
      .expect(401);
  });

  it("RBAC: viewer não cria projeto (403)", async () => {
    const login = await request(http)
      .post("/api/auth/login")
      .send({ email: "ownerA@e2e.com", password: "senha12345" })
      .expect(201);
    const owner = login.body.accessToken;

    await request(http)
      .post("/api/auth/users")
      .set("Authorization", `Bearer ${owner}`)
      .send({ name: "Vera", email: "viewerA@e2e.com", password: "senha12345", role: "viewer" })
      .expect(201);

    const vlogin = await request(http)
      .post("/api/auth/login")
      .send({ email: "viewerA@e2e.com", password: "senha12345" })
      .expect(201);

    await request(http)
      .post("/api/projects")
      .set("Authorization", `Bearer ${vlogin.body.accessToken}`)
      .send(project)
      .expect(403);
  });

  it("sem token → 401", async () => {
    await request(http).get("/api/projects").expect(401);
  });

  it("threatatlas: pull sem publicar → 400 (integração complementar)", async () => {
    const login = await request(http)
      .post("/api/auth/login")
      .send({ email: "ownerA@e2e.com", password: "senha12345" })
      .expect(201);
    const token = login.body.accessToken;

    const projects = await request(http)
      .get("/api/projects")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    const projectId = projects.body[0].id;

    const tm = await request(http)
      .post(`/api/projects/${projectId}/threat-models`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "TM E2E" })
      .expect(201);

    await request(http)
      .post(`/api/threat-models/${tm.body.id}/pull`)
      .set("Authorization", `Bearer ${token}`)
      .expect(400);
  });
});
