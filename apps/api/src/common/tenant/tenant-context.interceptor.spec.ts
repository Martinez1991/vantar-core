jest.mock("typeorm-transactional", () => ({
  runInTransaction: (cb: () => unknown) => cb(),
}));

import { firstValueFrom, of } from "rxjs";
import { TenantContextInterceptor } from "./tenant-context.interceptor";

function ctx(tenantId?: string): any {
  return { switchToHttp: () => ({ getRequest: () => ({ user: tenantId ? { tenantId } : undefined }) }) };
}

describe("TenantContextInterceptor", () => {
  it("sem usuário: passa direto", async () => {
    const repo = { query: jest.fn() };
    const interceptor = new TenantContextInterceptor(repo as any);
    const next = { handle: () => of("passou") };
    const res = await firstValueFrom(interceptor.intercept(ctx(), next as any));
    expect(res).toBe("passou");
    expect(repo.query).not.toHaveBeenCalled();
  });

  it("com usuário: seta o GUC de tenant e executa o handler", async () => {
    const repo = { query: jest.fn(async () => undefined) };
    const interceptor = new TenantContextInterceptor(repo as any);
    const next = { handle: () => of("ok") };
    const res = await firstValueFrom(interceptor.intercept(ctx("t1"), next as any));
    expect(res).toBe("ok");
    expect(repo.query).toHaveBeenCalledWith(expect.stringContaining("set_config"), ["t1"]);
  });
});
