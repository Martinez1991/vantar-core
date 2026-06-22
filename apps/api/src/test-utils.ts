/* Utilitários de teste — mocks de repositório TypeORM. Não entra na cobertura. */

let seq = 0;

export type MockRepo = {
  find: jest.Mock;
  findOne: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
  count: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  remove: jest.Mock;
  insert: jest.Mock;
  query: jest.Mock;
  createQueryBuilder: jest.Mock;
};

export function mockRepo(overrides: Partial<MockRepo> = {}): MockRepo {
  return {
    find: jest.fn(async () => []),
    findOne: jest.fn(async () => null),
    save: jest.fn(async (e: any) =>
      Array.isArray(e) ? e : { id: e?.id ?? `id-${++seq}`, ...e },
    ),
    create: jest.fn((e: any) => e),
    count: jest.fn(async () => 0),
    update: jest.fn(async () => ({ affected: 1 })),
    delete: jest.fn(async () => ({ affected: 1 })),
    remove: jest.fn(async (e: any) => e),
    insert: jest.fn(async () => ({ identifiers: [{ id: `id-${++seq}` }] })),
    query: jest.fn(async () => []),
    createQueryBuilder: jest.fn(),
    ...overrides,
  };
}
