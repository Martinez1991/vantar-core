import { assertPublicHttpUrl, SsrfError } from "./ssrf-guard";

describe("ssrf-guard (SEC-02)", () => {
  it("rejeita esquema não-http", async () => {
    await expect(assertPublicHttpUrl("ftp://example.com")).rejects.toBeInstanceOf(SsrfError);
    await expect(assertPublicHttpUrl("file:///etc/passwd")).rejects.toBeInstanceOf(SsrfError);
  });

  it("bloqueia IMDS (metadados de nuvem)", async () => {
    await expect(
      assertPublicHttpUrl("http://169.254.169.254/latest/meta-data/"),
    ).rejects.toThrow(/IMDS/);
  });

  it("bloqueia faixas privadas e loopback", async () => {
    await expect(assertPublicHttpUrl("http://10.0.0.5:8080")).rejects.toBeInstanceOf(SsrfError);
    await expect(assertPublicHttpUrl("https://192.168.1.10")).rejects.toBeInstanceOf(SsrfError);
    await expect(assertPublicHttpUrl("http://127.0.0.1:4000")).rejects.toBeInstanceOf(SsrfError);
  });

  it("permite IP público", async () => {
    await expect(assertPublicHttpUrl("https://8.8.8.8/.well-known/openid-configuration")).resolves.toBeUndefined();
  });

  it("URL inválida → SsrfError", async () => {
    await expect(assertPublicHttpUrl("not a url")).rejects.toBeInstanceOf(SsrfError);
  });
});
