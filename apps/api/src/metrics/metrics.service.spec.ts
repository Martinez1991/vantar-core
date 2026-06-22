import { MetricsService } from "./metrics.service";

describe("MetricsService", () => {
  it("expõe métricas HTTP e default do Node", async () => {
    const svc = new MetricsService();
    svc.httpRequests.inc({ method: "GET", route: "/health", status: "200" });
    const out = await svc.metrics();
    expect(out).toContain("http_requests_total");
    expect(out).toContain("vantar-api"); // default label
    expect(svc.contentType).toMatch(/text\/plain/);
  });
});
