import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Criticality, Environment } from "./project.entity";
import { ProjectsService } from "./projects.service";

const dto = {
  name: "Novo",
  owner: "Squad",
  criticality: Criticality.Media,
  environment: Environment.Cloud,
};

function makeService(opts: { plan?: string; count: number }) {
  const projectsRepo = {
    create: jest.fn((x) => x),
    save: jest.fn(async (x) => ({ id: "p1", ...x })),
    count: jest.fn(async () => opts.count),
  };
  const tenantsRepo = {
    findOne: jest.fn(async () =>
      opts.plan ? { id: "t1", plan: opts.plan } : null,
    ),
  };
  const service = new ProjectsService(
    projectsRepo as any,
    tenantsRepo as any,
  );
  return { service, projectsRepo, tenantsRepo };
}

describe("ProjectsService — limite CE (RF-PRJ-007)", () => {
  it("bloqueia o 6º projeto na Community", async () => {
    const { service } = makeService({ plan: "community", count: 5 });
    await expect(service.create("t1", dto as any)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("permite criar abaixo do limite", async () => {
    const { service, projectsRepo } = makeService({ plan: "community", count: 2 });
    const created = await service.create("t1", dto as any);
    expect(created.id).toBe("p1");
    expect(projectsRepo.save).toHaveBeenCalled();
  });

  it("Enterprise não tem limite rígido", async () => {
    const { service } = makeService({ plan: "enterprise", count: 50 });
    await expect(service.create("t1", dto as any)).resolves.toHaveProperty("id");
  });
});

describe("ProjectsService — leitura e mutações", () => {
  function svc() {
    const projectsRepo: any = {
      find: jest.fn(async () => []),
      findOne: jest.fn(async () => null),
      save: jest.fn(async (p: any) => p),
      create: jest.fn((p: any) => p),
      count: jest.fn(async () => 0),
    };
    const tenantsRepo: any = { findOne: jest.fn() };
    return { service: new ProjectsService(projectsRepo, tenantsRepo), projectsRepo };
  }

  it("findOne inexistente → NotFound", async () => {
    const { service } = svc();
    await expect(service.findOne("t1", "x")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("update aplica e salva", async () => {
    const { service, projectsRepo } = svc();
    projectsRepo.findOne.mockResolvedValue({ id: "p1", name: "Old", securityScore: 0 });
    const res = await service.update("t1", "p1", { name: "Novo" } as any);
    expect(res.name).toBe("Novo");
    expect(projectsRepo.save).toHaveBeenCalled();
  });

  it("archive marca archived=true", async () => {
    const { service, projectsRepo } = svc();
    projectsRepo.findOne.mockResolvedValue({ id: "p1", archived: false });
    const res = await service.archive("t1", "p1");
    expect(res.archived).toBe(true);
  });

  it("summary agrega por criticidade e média de score", async () => {
    const { service, projectsRepo } = svc();
    projectsRepo.find.mockResolvedValue([
      { criticality: Criticality.Critica, openRisks: 2, securityScore: 60 },
      { criticality: Criticality.Media, openRisks: 1, securityScore: 80 },
    ]);
    const s = await service.summary("t1");
    expect(s.totalProjects).toBe(2);
    expect(s.openRisks).toBe(3);
    expect(s.criticalProjects).toBe(1);
    expect(s.avgSecurityScore).toBe(70);
  });
});
