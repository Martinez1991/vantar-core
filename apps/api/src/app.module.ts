import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { TypeOrmModule } from "@nestjs/typeorm";
import { join } from "path";
import { DataSource } from "typeorm";
import { addTransactionalDataSource } from "typeorm-transactional";
import { buildTypeOrmOptions } from "./database/typeorm.options";
import { AiModule } from "./ai/ai.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { AuditModule } from "./audit/audit.module";
import { AuthModule } from "./auth/auth.module";
import { MetricsModule } from "./metrics/metrics.module";
import { HealthController } from "./health/health.controller";
import { NotificationsModule } from "./notifications/notifications.module";
import { ProjectsModule } from "./projects/projects.module";
import { QuestionnairesModule } from "./questionnaires/questionnaires.module";
import { ReportsModule } from "./reports/reports.module";
import { RequirementsModule } from "./requirements/requirements.module";
import { RisksModule } from "./risks/risks.module";
import { ThreatModelingModule } from "./threat-modeling/threat-modeling.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(__dirname, "../../../.env"), ".env"],
    }),
    // Runtime conecta como vantar_app (sujeito a RLS); registra a DataSource
    // como transacional para o GUC de tenant ser setado por requisição.
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const opts = buildTypeOrmOptions();
        const appUrl = process.env.APP_DATABASE_URL;
        return appUrl
          ? {
              ...opts,
              url: appUrl,
              host: undefined,
              port: undefined,
              username: undefined,
              password: undefined,
              database: undefined,
            }
          : opts;
      },
      dataSourceFactory: async (options) => {
        if (!options) throw new Error("Opções de DataSource ausentes.");
        return addTransactionalDataSource(new DataSource(options));
      },
    }),
    // Rate limiting (RS-APP-003): 120 req/min por IP por padrão.
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.THROTTLE_TTL ?? 60000),
        limit: Number(process.env.THROTTLE_LIMIT ?? 120),
      },
    ]),
    // MetricsModule antes do AuthModule → interceptor de métricas é o mais
    // externo (mede a requisição inteira). AuditModule depois → seu interceptor
    // roda dentro da transação de tenant.
    MetricsModule,
    AuthModule,
    AuditModule,
    NotificationsModule,
    ProjectsModule,
    RisksModule,
    QuestionnairesModule,
    ThreatModelingModule,
    RequirementsModule,
    ReportsModule,
    AnalyticsModule,
    AiModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
