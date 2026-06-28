import {
  decryptSecret,
  encryptSecret,
  encryptedSecret,
  isEncrypted,
  resetSecretKeyCache,
} from "./secret-cipher";

describe("secret-cipher (SEC-01)", () => {
  beforeAll(() => {
    process.env.APP_ENCRYPTION_KEY = "test-master-key-for-secret-cipher";
    resetSecretKeyCache();
  });

  it("round-trip: decrypt(encrypt(x)) === x", () => {
    const plain = "ghp_aBcDeF1234567890token";
    const enc = encryptSecret(plain);
    expect(isEncrypted(enc)).toBe(true);
    expect(enc).not.toContain(plain); // não vaza o claro
    expect(decryptSecret(enc)).toBe(plain);
  });

  it("cifragens do mesmo texto diferem (IV aleatório)", () => {
    expect(encryptSecret("abc")).not.toBe(encryptSecret("abc"));
  });

  it("isEncrypted distingue cifrado de claro", () => {
    expect(isEncrypted("texto-plano")).toBe(false);
    expect(isEncrypted(encryptSecret("x"))).toBe(true);
  });

  it("decrypt tolera legado em texto plano (não cifrado)", () => {
    expect(decryptSecret("legado-em-claro")).toBe("legado-em-claro");
  });

  it("transformer: to cifra, from decifra, null passa intacto", () => {
    const enc = encryptedSecret.to("s3cr3t") as string;
    expect(isEncrypted(enc)).toBe(true);
    expect(encryptedSecret.from(enc)).toBe("s3cr3t");
    expect(encryptedSecret.to(null)).toBeNull();
    expect(encryptedSecret.from(null)).toBeNull();
    expect(encryptedSecret.to(undefined)).toBeUndefined();
  });

  it("tag GCM detecta adulteração", () => {
    const enc = encryptSecret("integridade");
    const tampered = enc.slice(0, -4) + "AAAA"; // corrompe o ciphertext
    expect(() => decryptSecret(tampered)).toThrow();
  });
});
