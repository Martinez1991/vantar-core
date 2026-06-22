import { Controller, Get, Res } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { Public } from "../auth/decorators";
import { MetricsService } from "./metrics.service";

@ApiTags("metrics")
@Controller("metrics")
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "Métricas Prometheus (RNF-OBS-001)" })
  async scrape(@Res() res: Response): Promise<void> {
    res.setHeader("Content-Type", this.metrics.contentType);
    res.send(await this.metrics.metrics());
  }
}
