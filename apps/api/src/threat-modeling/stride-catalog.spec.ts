import { STRIDE_BY_TYPE } from "./stride-catalog";

describe("STRIDE por tipo de elemento (RF-TM-002)", () => {
  it("aplica o mapeamento clássico", () => {
    expect(STRIDE_BY_TYPE.external).toHaveLength(2);
    expect(STRIDE_BY_TYPE.process).toHaveLength(6); // STRIDE completo
    expect(STRIDE_BY_TYPE.datastore).toHaveLength(4);
    expect(STRIDE_BY_TYPE.boundary).toHaveLength(0); // boundary não gera ameaça
  });

  it("entidade externa cobre Spoofing e Repudiation", () => {
    expect(STRIDE_BY_TYPE.external).toEqual(
      expect.arrayContaining(["Spoofing", "Repudiation"]),
    );
  });
});
