import { ThreatAtlasSyncService } from "./threatatlas-sync.service";

describe("ThreatAtlasSyncService", () => {
  const OLD = process.env;
  afterEach(() => {
    process.env = OLD;
  });

  it("não configurado: isConfigured false e push honesto", async () => {
    process.env = { ...OLD };
    delete process.env.THREATATLAS_URL;
    delete process.env.THREATATLAS_API_TOKEN;
    const svc = new ThreatAtlasSyncService();
    expect(svc.isConfigured()).toBe(false);
    const res = await svc.push({ id: "m1", name: "TM", dfd: {} } as any, []);
    expect(res.configured).toBe(false);
    expect(res.ok).toBe(false);
    expect(res.message).toMatch(/não configurado/i);
  });

  it("configurado: isConfigured true", () => {
    process.env = { ...OLD, THREATATLAS_URL: "http://ta", THREATATLAS_API_TOKEN: "tok" };
    expect(new ThreatAtlasSyncService().isConfigured()).toBe(true);
  });

  it("configurado: push faz POST e retorna ref no sucesso", async () => {
    process.env = { ...OLD, THREATATLAS_URL: "http://ta", THREATATLAS_API_TOKEN: "tok" };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "ta-1" }) }) as any;
    const res = await new ThreatAtlasSyncService().push(
      { id: "m1", name: "TM", dfd: { nodes: [], flows: [] } } as any,
      [],
    );
    expect(res.configured).toBe(true);
    expect(res.ok).toBe(true);
    expect(res.ref).toBe("ta-1");
    expect(global.fetch).toHaveBeenCalled();
  });

  it("configurado: push trata resposta de erro", async () => {
    process.env = { ...OLD, THREATATLAS_URL: "http://ta", THREATATLAS_API_TOKEN: "tok" };
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as any;
    const res = await new ThreatAtlasSyncService().push({ id: "m1", name: "TM", dfd: {} } as any, []);
    expect(res.ok).toBe(false);
    expect(res.message).toMatch(/500/);
  });

  it("não configurado: pull honesto (configured:false)", async () => {
    process.env = { ...OLD };
    delete process.env.THREATATLAS_URL;
    delete process.env.THREATATLAS_API_TOKEN;
    const res = await new ThreatAtlasSyncService().pull("ta-1");
    expect(res).toMatchObject({ configured: false, ok: false });
    expect(res.message).toMatch(/não configurado/i);
  });

  it("configurado: pull faz GET e retorna o estado", async () => {
    process.env = { ...OLD, THREATATLAS_URL: "http://ta/", THREATATLAS_API_TOKEN: "tok" };
    const state = { status: "approved", version: 3, threats: [], comments: [] };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => state }) as any;
    const res = await new ThreatAtlasSyncService().pull("ta-1");
    expect(res).toMatchObject({ configured: true, ok: true, state });
    expect(global.fetch).toHaveBeenCalledWith(
      "http://ta/api/threat-models/ta-1",
      expect.objectContaining({ headers: { Authorization: "Bearer tok" } }),
    );
  });

  it("configurado: pull trata resposta de erro", async () => {
    process.env = { ...OLD, THREATATLAS_URL: "http://ta", THREATATLAS_API_TOKEN: "tok" };
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 }) as any;
    const res = await new ThreatAtlasSyncService().pull("nope");
    expect(res.ok).toBe(false);
    expect(res.message).toMatch(/404/);
  });
});
