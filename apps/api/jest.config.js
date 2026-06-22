/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: { "^.+\\.ts$": "ts-jest" },
  testEnvironment: "node",
  // "Core" = lógica de negócio (RNF-MAINT-001): services + guards + helpers.
  // Código declarativo (entities, dtos, modules, controllers, migrations) fica fora.
  collectCoverageFrom: [
    "**/*.service.ts",
    "!**/queue.service.ts",
    "**/risk-level.ts",
    "**/scoring.ts",
    "**/stride-catalog.ts",
    "auth/roles.guard.ts",
    "auth/jwt-auth.guard.ts",
    "auth/jwt-keys.ts",
    "common/tenant/tenant-context.interceptor.ts",
  ],
  coverageDirectory: "../coverage",
  // Trava a cobertura do core (RNF-MAINT-001). Limiares abaixo do atual
  // (stmts 87 / lines 90 / funcs 84 / branches 66) para evitar flakiness.
  coverageThreshold: {
    global: { statements: 82, lines: 85, functions: 78, branches: 60 },
  },
};
