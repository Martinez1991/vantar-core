import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../auth/decorators";

@ApiTags("health")
@Controller("health")
export class HealthController {
  @Public()
  @Get()
  check() {
    return {
      status: "ok",
      service: "vantar-business-plane",
      version: "0.1.0",
      timestamp: new Date().toISOString(),
    };
  }
}
