import { ForbiddenException } from "@nestjs/common";
import { RolesGuard } from "./roles.guard";
import { Role } from "./user.entity";

function ctx(role?: Role): any {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user: role ? { role } : undefined }) }),
  };
}
function guard(required?: Role[]) {
  return new RolesGuard({ getAllAndOverride: () => required } as any);
}

describe("RolesGuard", () => {
  it("sem @Roles libera qualquer autenticado", () => {
    expect(guard(undefined).canActivate(ctx(Role.Viewer))).toBe(true);
  });
  it("owner/admin sempre passam", () => {
    expect(guard([Role.AppSec]).canActivate(ctx(Role.Owner))).toBe(true);
    expect(guard([Role.AppSec]).canActivate(ctx(Role.Admin))).toBe(true);
  });
  it("papel listado passa", () => {
    expect(guard([Role.Developer]).canActivate(ctx(Role.Developer))).toBe(true);
  });
  it("papel não permitido → Forbidden", () => {
    expect(() => guard([Role.AppSec]).canActivate(ctx(Role.Viewer))).toThrow(ForbiddenException);
  });
});
