import { EventBus } from "./event-bus.service";

const flush = () => new Promise((r) => setImmediate(r));

describe("EventBus", () => {
  it("entrega o evento ao handler assinante (fora do stack)", async () => {
    const bus = new EventBus();
    const seen: string[] = [];
    bus.on("risk.accepted", (p) => seen.push(p.title));

    bus.emit({ tenantId: "t1", event: "risk.accepted", title: "ok" });
    expect(seen).toHaveLength(0); // assíncrono — ainda não entregou
    await flush();
    expect(seen).toEqual(["ok"]);
  });

  it("não entrega a quem não assinou aquele evento", async () => {
    const bus = new EventBus();
    const seen: string[] = [];
    bus.on("risk.accepted", () => seen.push("a"));
    bus.emit({ tenantId: "t1", event: "risk.critical", title: "x" });
    await flush();
    expect(seen).toHaveLength(0);
  });
});
