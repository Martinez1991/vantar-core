import "reflect-metadata";
import { config as loadEnv } from "dotenv";
import { join } from "path";
import { DataSource } from "typeorm";
import { buildTypeOrmOptions } from "./typeorm.options";

// DataSource usado pelo CLI do TypeORM (generate/run/revert migrations).
loadEnv({ path: join(__dirname, "../../../../.env") });
loadEnv();

export default new DataSource(buildTypeOrmOptions());
