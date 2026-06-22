import { UnauthorizedException } from "@nestjs/common";
import { JwtAuthGuard } from "./jwt-auth.guard";

function makeCtx(authHeader?: string) {
  const req: any = { header: (k: string) => (k === "authorization" ? authHeader : undefined), user: undefined };
  const ctx: any = {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => req }),
  };
  return { req, ctx };
}

describe("JwtAuthGuard", () => {
  it("rota pública passa sem token", async () => {
    const jwt = { verifyAsync: jest.fn() };
    const guard = new JwtAuthGuard(jwt as any, { getAllAndOverride: () => true } as any);
    const { ctx } = makeCtx();
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(jwt.verifyAsync).not.toHaveBeenCalled();
  });

  it("token ausente → Unauthorized", async () => {
    const guard = new JwtAuthGuard({ verifyAsync: jest.fn() } as any, { getAllAndOverride: () => false } as any);
    const { ctx } = makeCtx();
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("token válido popula req.user", async () => {
    const jwt = { verifyAsync: jest.fn(async () => ({ sub: "u1", tenantId: "t1", email: "e", role: "owner" })) };
    const guard = new JwtAuthGuard(jwt as any, { getAllAndOverride: () => false } as any);
    const { ctx, req } = makeCtx("Bearer abc.def.ghi");
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(req.user).toEqual({ userId: "u1", tenantId: "t1", email: "e", role: "owner" });
  });

  it("token inválido → Unauthorized", async () => {
    const jwt = { verifyAsync: jest.fn(async () => { throw new Error("bad"); }) };
    const guard = new JwtAuthGuard(jwt as any, { getAllAndOverride: () => false } as any);
    const { ctx } = makeCtx("Bearer x");
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
