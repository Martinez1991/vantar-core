import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { finalize, Observable } from "rxjs";
import { MetricsService } from "./metrics.service";

/** Observa contagem e duração de cada requisição HTTP. */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") return next.handle();
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const stop = this.metrics.httpDuration.startTimer();

    return next.handle().pipe(
      finalize(() => {
        const route = req.route?.path ?? req.path ?? "unmatched";
        const labels = { method: req.method, route, status: String(res.statusCode) };
        this.metrics.httpRequests.inc(labels);
        stop(labels);
      }),
    );
  }
}
