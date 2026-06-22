import { Injectable, Logger } from "@nestjs/common";
import { AtlasComment, ThreatModel } from "./threat-model.entity";
import { Threat } from "./threat.entity";

export type SyncResult = {
  configured: boolean;
  ok: boolean;
  ref?: string;
  message: string;
};

/** Estado colaborativo lido de volta do ThreatAtlas (system-of-record). */
export type AtlasThreatState = {
  element?: string;
  category?: string;
  title?: string;
  status?: string; // open | mitigated | accepted
};

export type AtlasState = {
  status?: string; // approved | review | draft
  version?: number;
  threats?: AtlasThreatState[];
  comments?: AtlasComment[];
};

export type PullResult = {
  configured: boolean;
  ok: boolean;
  message: string;
  state?: AtlasState;
};

/**
 * Integração com o OWASP ThreatAtlas (system-of-record — RF-TM-006 / §5.4).
 * O Vantar é o gerador/curador; aqui publicamos DFD + ameaças via API Token.
 *
 * Honesto por design: sem THREATATLAS_URL + THREATATLAS_API_TOKEN, não finge
 * sucesso — retorna `configured: false`. Com token, faz o push real.
 */
@Injectable()
export class ThreatAtlasSyncService {
  private readonly logger = new Logger(ThreatAtlasSyncService.name);

  isConfigured(): boolean {
    return Boolean(process.env.THREATATLAS_URL && process.env.THREATATLAS_API_TOKEN);
  }

  async push(model: ThreatModel, threats: Threat[]): Promise<SyncResult> {
    if (!this.isConfigured()) {
      return {
        configured: false,
        ok: false,
        message:
          "OWASP ThreatAtlas não configurado (defina THREATATLAS_URL e THREATATLAS_API_TOKEN para publicar).",
      };
    }

    const url = `${process.env.THREATATLAS_URL!.replace(/\/$/, "")}/api/threat-models`;
    const payload = {
      externalId: model.id,
      name: model.name,
      dfd: model.dfd,
      threats: threats.map((t) => ({
        element: t.elementName,
        category: t.category,
        title: t.title,
        description: t.description,
        mitigation: t.mitigation,
        status: t.status,
      })),
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.THREATATLAS_API_TOKEN}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (!res.ok) {
        return {
          configured: true,
          ok: false,
          message: `ThreatAtlas respondeu ${res.status}.`,
        };
      }
      const body = (await res.json().catch(() => ({}))) as { id?: string };
      return {
        configured: true,
        ok: true,
        ref: body.id ?? model.id,
        message: "Publicado no OWASP ThreatAtlas.",
      };
    } catch (e) {
      this.logger.warn(`Falha ao sincronizar com ThreatAtlas: ${(e as Error).message}`);
      return {
        configured: true,
        ok: false,
        message: `Falha ao contatar o ThreatAtlas: ${(e as Error).message}`,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Pull (RF-TM-006, lado bidirecional): lê de volta o estado colaborativo do
   * ThreatAtlas — aprovação/versão, status das ameaças e comentários. Honesto:
   * sem token não finge; com token, faz o GET real.
   */
  async pull(ref: string): Promise<PullResult> {
    if (!this.isConfigured()) {
      return {
        configured: false,
        ok: false,
        message:
          "OWASP ThreatAtlas não configurado (defina THREATATLAS_URL e THREATATLAS_API_TOKEN para sincronizar).",
      };
    }

    const url = `${process.env.THREATATLAS_URL!.replace(/\/$/, "")}/api/threat-models/${ref}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${process.env.THREATATLAS_API_TOKEN}` },
        signal: controller.signal,
      });
      if (!res.ok) {
        return {
          configured: true,
          ok: false,
          message: `ThreatAtlas respondeu ${res.status}.`,
        };
      }
      const state = (await res.json().catch(() => ({}))) as AtlasState;
      return {
        configured: true,
        ok: true,
        state,
        message: "Estado sincronizado do OWASP ThreatAtlas.",
      };
    } catch (e) {
      this.logger.warn(`Falha ao puxar do ThreatAtlas: ${(e as Error).message}`);
      return {
        configured: true,
        ok: false,
        message: `Falha ao contatar o ThreatAtlas: ${(e as Error).message}`,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
