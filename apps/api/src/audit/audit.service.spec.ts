import { mockRepo } from "../test-utils";
import { AuditService } from "./audit.service";

const entry = {
  tenantId: "t1",
  userId: "u1",
  userEmail: "a@b.com",
  method: "POST",
  path: "/api/risks/x/accept",
  statusCode: 201,
  ip: "127.0.0.1",
};

describe("AuditService", () => {
  it("record monta a ação method+path e insere", async () => {
    const logs = mockRepo();
    const service = new AuditService(logs as any);
    await service.record(entry);
    expect(logs.insert).toHaveBeenCalledWith(
      expect.objectContaining({ action: "POST /api/risks/x/accept", statusCode: 201 }),
    );
  });

  it("record coage userId não-uuid (máquina) para null", async () => {
    const logs = mockRepo();
    const service = new AuditService(logs as any);
    await service.record({ ...entry, userId: "scim:abc123", userEmail: "scim:abc123" });
    expect(logs.insert).toHaveBeenCalledWith(
      expect.objectContaining({ userId: null, userEmail: "scim:abc123" }),
    );
  });

  it("record preserva userId uuid válido", async () => {
    const logs = mockRepo();
    const service = new AuditService(logs as any);
    const uuid = "11111111-2222-4333-8444-555555555555";
    await service.record({ ...entry, userId: uuid });
    expect(logs.insert).toHaveBeenCalledWith(expect.objectContaining({ userId: uuid }));
  });

  it("record nunca propaga erro (best-effort)", async () => {
    const logs = mockRepo();
    logs.insert.mockRejectedValue(new Error("db down"));
    const service = new AuditService(logs as any);
    await expect(service.record(entry)).resolves.toBeUndefined();
  });

  it("list filtra por tenant e limita", async () => {
    const logs = mockRepo();
    logs.find.mockResolvedValue([{ id: "a1" }]);
    const service = new AuditService(logs as any);
    const res = await service.list("t1", 1000);
    expect(res).toHaveLength(1);
    expect(logs.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: "t1" }, take: 500 }),
    );
  });
});
