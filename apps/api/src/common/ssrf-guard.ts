import { BlockList } from "node:net";
import { promises as dns } from "node:dns";

/**
 * Guard anti-SSRF (SEC-02) para buscas server-side de URLs fornecidas por
 * (admins de) tenant — notadamente o `issuer` OIDC consumido por
 * `Issuer.discover`. Resolve o host e recusa destinos não roteáveis/privados e,
 * sempre, o endpoint de metadados de nuvem (IMDS).
 */

export class SsrfError extends Error {}

// Endereços de metadados de nuvem — nunca destino legítimo (AWS/GCP/Azure/OCI).
const IMDS = new Set(["169.254.169.254", "fd00:ec2::254"]);

// Faixas não roteáveis publicamente (bloqueadas salvo host na allowlist).
const blocked = new BlockList();
blocked.addSubnet("0.0.0.0", 8, "ipv4");
blocked.addSubnet("10.0.0.0", 8, "ipv4");
blocked.addSubnet("100.64.0.0", 10, "ipv4"); // CGNAT
blocked.addSubnet("127.0.0.0", 8, "ipv4"); // loopback
blocked.addSubnet("169.254.0.0", 16, "ipv4"); // link-local (inclui IMDS)
blocked.addSubnet("172.16.0.0", 12, "ipv4");
blocked.addSubnet("192.0.0.0", 24, "ipv4");
blocked.addSubnet("192.168.0.0", 16, "ipv4");
blocked.addSubnet("198.18.0.0", 15, "ipv4"); // benchmark
blocked.addSubnet("224.0.0.0", 4, "ipv4"); // multicast
blocked.addAddress("::1", "ipv6"); // loopback
blocked.addSubnet("fc00::", 7, "ipv6"); // ULA
blocked.addSubnet("fe80::", 10, "ipv6"); // link-local
blocked.addSubnet("ff00::", 8, "ipv6"); // multicast

function allowlist(): Set<string> {
  return new Set(
    (process.env.SSRF_ALLOWLIST ?? "")
      .split(",")
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** Lança `SsrfError` se a URL não for um destino HTTP(S) público seguro. */
export async function assertPublicHttpUrl(rawUrl: string): Promise<void> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new SsrfError("URL inválida");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new SsrfError(`esquema não permitido: ${url.protocol}`);
  }
  const host = url.hostname.toLowerCase();

  let addrs: { address: string; family: number }[];
  try {
    addrs = await dns.lookup(host, { all: true });
  } catch {
    throw new SsrfError(`host não resolvível: ${host}`);
  }

  // IMDS é bloqueado SEMPRE, inclusive para hosts allowlistados.
  if (addrs.some((a) => IMDS.has(a.address))) {
    throw new SsrfError("acesso a metadados da nuvem (IMDS) bloqueado");
  }
  if (allowlist().has(host)) return;

  for (const a of addrs) {
    const type = a.family === 6 ? "ipv6" : "ipv4";
    if (blocked.check(a.address, type)) {
      throw new SsrfError(`destino em faixa não roteável/privada bloqueado: ${a.address}`);
    }
  }
}
