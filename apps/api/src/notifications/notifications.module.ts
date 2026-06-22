import { Global, Module } from "@nestjs/common";
import { EventBus } from "./event-bus.service";

/**
 * Barramento de eventos interno do framework. Global para que os serviços de
 * domínio emitam sem acoplamento de import. No núcleo aberto não há
 * assinantes/dispatch (notificações Slack/Teams/webhook são Enterprise) — a
 * emissão é um no-op observável.
 */
@Global()
@Module({
  providers: [EventBus],
  exports: [EventBus],
})
export class NotificationsModule {}
