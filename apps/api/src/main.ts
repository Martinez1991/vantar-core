import "reflect-metadata";
import { initializeTransactionalContext } from "typeorm-transactional";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";

/** Avisa sobre configuração insegura em produção (RS-IAM-002). */
function validateEnv() {
  if (process.env.NODE_ENV !== "production") return;
  if (!process.env.JWT_PRIVATE_KEY || !process.env.JWT_PUBLIC_KEY) {
    // eslint-disable-next-line no-console
    console.warn(
      "[boot] JWT_PRIVATE_KEY/PUBLIC_KEY ausentes — um par RSA efêmero será usado (tokens não sobrevivem a restart). Defina chaves persistentes em produção.",
    );
  }
}

async function bootstrap() {
  validateEnv();
  // Contexto transacional (CLS) — base para o GUC de tenant do RLS.
  initializeTransactionalContext();
  const app = await NestFactory.create(AppModule, { cors: false });

  // Security headers (RS-APP-005).
  app.use(helmet());

  // CORS para o frontend (RNF-COMPAT). Allowlist via env.
  const origins = (process.env.CORS_ORIGINS ?? "http://localhost:3000").split(",");
  app.enableCors({ origin: origins, credentials: true });

  // Prefixo de API versionada.
  app.setGlobalPrefix("api", { exclude: ["health", "metrics"] });

  // Validação e sanitização globais (RS-APP-002).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // OpenAPI (RF-INT-001).
  const config = new DocumentBuilder()
    .setTitle("Vantar Business Plane API")
    .setDescription(
      "API de negócio do Vantar (Identity & Tenancy, Project Portfolio, …). Autenticação via Bearer JWT; o tenant é derivado do token.",
    )
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Vantar API em http://localhost:${port} (docs: /docs)`);
}

bootstrap();
