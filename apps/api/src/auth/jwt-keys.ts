import { generateKeyPairSync } from "crypto";

/**
 * Chaves RSA para assinar/validar o JWT em RS256 (RS-IAM-002).
 * Em produção, forneça JWT_PRIVATE_KEY/JWT_PUBLIC_KEY (PEM, opcionalmente em
 * base64). Sem elas, geramos um par efêmero (válido só nesta execução) e
 * avisamos — adequado a dev/self-host demo, não a produção real.
 */
let cached: { privateKey: string; publicKey: string; ephemeral: boolean } | null = null;

function decodePem(value: string): string {
  return value.includes("BEGIN")
    ? value
    : Buffer.from(value, "base64").toString("utf8");
}

export function getJwtKeys() {
  if (cached) return cached;
  const priv = process.env.JWT_PRIVATE_KEY;
  const pub = process.env.JWT_PUBLIC_KEY;
  if (priv && pub) {
    cached = { privateKey: decodePem(priv), publicKey: decodePem(pub), ephemeral: false };
  } else {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    cached = { privateKey, publicKey, ephemeral: true };
    // eslint-disable-next-line no-console
    console.warn(
      "[auth] JWT_PRIVATE_KEY/PUBLIC_KEY ausentes — par RSA efêmero gerado (tokens não sobrevivem a restart). Defina as chaves em produção (RS-IAM-002).",
    );
  }
  return cached;
}
