import { Injectable } from "@nestjs/common";
import { EventEmitter } from "events";
import { NotificationEvent, NotificationPayload } from "./notification-events";

/**
 * Barramento de eventos interno (sem dependência externa). Os serviços de
 * domínio emitem; o NotificationsService assina. A emissão é "fire-and-forget"
 * e desacoplada da transação do request: os listeners rodam em microtask e
 * abrem sua própria transação para resolver o tenant (RLS).
 */
@Injectable()
export class EventBus {
  private readonly emitter = new EventEmitter();

  constructor() {
    // Notificações nunca devem derrubar o processo por um erro de listener.
    this.emitter.setMaxListeners(50);
    this.emitter.on("error", () => undefined);
  }

  emit(payload: NotificationPayload): void {
    // Adia para fora do stack do request — não bloqueia a resposta.
    setImmediate(() => this.emitter.emit(payload.event, payload));
  }

  on(
    event: NotificationEvent,
    handler: (p: NotificationPayload) => void,
  ): void {
    this.emitter.on(event, handler);
  }
}
