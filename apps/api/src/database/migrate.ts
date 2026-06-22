import "reflect-metadata";
import dataSource from "./data-source";

/** Aplica as migrations pendentes. Roda na subida do container, antes do seed. */
async function run() {
  await dataSource.initialize();
  const applied = await dataSource.runMigrations();
  if (applied.length === 0) {
    console.log("Migrations: nada pendente.");
  } else {
    console.log(`Migrations aplicadas: ${applied.map((m) => m.name).join(", ")}`);
  }
  await dataSource.destroy();
}

run().catch((err) => {
  console.error("Falha ao aplicar migrations:", err);
  process.exit(1);
});
