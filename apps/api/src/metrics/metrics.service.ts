import { Injectable } from "@nestjs/common";
import { collectDefaultMetrics, Counter, Histogram, Registry } from "prom-client";

/** Métricas Prometheus (RNF-OBS-001): default do Node + HTTP. */
@Injectable()
export class MetricsService {
  readonly registry = new Registry();
  readonly httpRequests: Counter;
  readonly httpDuration: Histogram;

  constructor() {
    this.registry.setDefaultLabels({ app: "vantar-api" });
    collectDefaultMetrics({ register: this.registry });
    this.httpRequests = new Counter({
      name: "http_requests_total",
      help: "Total de requisições HTTP",
      labelNames: ["method", "route", "status"],
      registers: [this.registry],
    });
    this.httpDuration = new Histogram({
      name: "http_request_duration_seconds",
      help: "Duração das requisições HTTP",
      labelNames: ["method", "route", "status"],
      buckets: [0.01, 0.05, 0.1, 0.3, 1, 3],
      registers: [this.registry],
    });
  }

  metrics(): Promise<string> {
    return this.registry.metrics();
  }

  get contentType(): string {
    return this.registry.contentType;
  }
}
