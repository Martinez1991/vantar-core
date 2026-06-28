import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";
import { ValueTransformer } from "typeorm";

/**
 * Cifra simétrica para **segredos em repouso** (RS-CRY-002, SEC-01/Q-07):
 * tokens de integração (Jira/Confluence/SCM) e client secret OIDC deixam de ser
 * texto plano no banco. AES-256-GCM (confidencialidade + integridade), com
 * formato versionado para permitir rotação e detecção de legado.
 *
 * Chave mestra via `APP_ENCRYPTION_KEY` (idealmente 32 bytes em base64; qualquer
 * string é derivada de forma determinística por SHA-256). Em produção a chave
 * deve vir de KMS/Secrets Manager (envelope encryption é a evolução natural);
 * aqui mantemos a fronteira pluggable. Sem a env, gera-se uma chave efêmera por
 * processo (apenas dev/teste) — `validateEnv` alerta em produção.
 */

const PREFIX = "enc:v1:";
let cachedKey: Buffer | null = null;

function key(): Buffer {
  if (cachedKey) return cachedKey;
  const raw = process.env.APP_ENCRYPTION_KEY;
  if (raw) {
    const decoded = Buffer.from(raw, "base64");
    cachedKey = decoded.length === 32 ? decoded : createHash("sha256").update(raw).digest();
  } else {
    cachedKey = randomBytes(32);
    // eslint-disable-next-line no-console
    console.warn(
      "[crypto] APP_ENCRYPTION_KEY ausente — chave efêmera por processo (segredos não sobrevivem a restart). Defina uma chave persistente (KMS) em produção.",
    );
  }
  return cachedKey;
}

/** Apenas para testes: força a re-leitura da chave da env. */
export function resetSecretKeyCache(): void {
  cachedKey = null;
}

export function isEncrypted(value: string): boolean {
  return typeof value === "string" && value.startsWith(PREFIX);
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return (
    PREFIX +
    [iv, tag, ct].map((b) => b.toString("base64")).join(":")
  );
}

export function decryptSecret(value: string): string {
  // Tolera legado em texto plano (janela entre deploy e migração de dados).
  if (!isEncrypted(value)) return value;
  const [ivB64, tagB64, ctB64] = value.slice(PREFIX.length).split(":");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const pt = Buffer.concat([
    decipher.update(Buffer.from(ctB64, "base64")),
    decipher.final(),
  ]);
  return pt.toString("utf8");
}

/**
 * Transformer de coluna TypeORM: cifra na escrita, decifra na leitura. `null`/
 * `undefined` passam intactos (colunas opcionais). Aplicar via
 * `@Column({ transformer: encryptedSecret })`.
 */
export const encryptedSecret: ValueTransformer = {
  to: (value?: string | null) => (value == null ? value : encryptSecret(value)),
  from: (value?: string | null) => (value == null ? value : decryptSecret(value)),
};
