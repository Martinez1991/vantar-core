/**
 * Eventos de negócio que disparam notificações (RF-INT-005). Mantidos enxutos
 * e de baixa frequência — ações humanas relevantes para segurança, não ruído.
 */
export const NOTIFICATION_EVENTS = [
  "risk.accepted",
  "risk.critical",
  "threat.promoted",
] as const;

export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number];

/** Carga comum a todo evento — sempre carrega o tenant para isolar o dispatch. */
export interface NotificationPayload {
  tenantId: string;
  event: NotificationEvent;
  title: string;
  // Linhas de contexto exibidas na mensagem (ex.: "Projeto: X", "Nível: alto").
  fields?: Record<string, string>;
  // Link opcional para o recurso no Vantar.
  url?: string;
}
