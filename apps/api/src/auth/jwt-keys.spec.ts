describe("getJwtKeys", () => {
  const OLD = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD };
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
  });
  afterAll(() => {
    process.env = OLD;
  });

  it("gera par efêmero quando não há chaves no env", () => {
    delete process.env.JWT_PRIVATE_KEY;
    delete process.env.JWT_PUBLIC_KEY;
    const { getJwtKeys } = require("./jwt-keys");
    const keys = getJwtKeys();
    expect(keys.ephemeral).toBe(true);
    expect(keys.privateKey).toContain("BEGIN");
    expect(keys.publicKey).toContain("BEGIN");
    expect(getJwtKeys()).toBe(keys); // memoizado
  });

  it("usa chaves do env (PEM ou base64)", () => {
    process.env.JWT_PRIVATE_KEY = Buffer.from("-----BEGIN PRIVATE KEY-----x").toString("base64");
    process.env.JWT_PUBLIC_KEY = "-----BEGIN PUBLIC KEY-----y";
    const { getJwtKeys } = require("./jwt-keys");
    const keys = getJwtKeys();
    expect(keys.ephemeral).toBe(false);
    expect(keys.privateKey).toContain("BEGIN PRIVATE KEY"); // base64 decodificado
    expect(keys.publicKey).toContain("BEGIN PUBLIC KEY");
  });
});
