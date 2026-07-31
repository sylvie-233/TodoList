import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './config/logger.config.js';
import { DatabaseModule } from './database/database.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
import { JwtAuthGuard } from './modules/auth/auth.guard.js';

// 业务模块
import { AuthModule } from './modules/auth/auth.module.js';
import { UserModule } from './modules/user/user.module.js';
import { ListModule } from './modules/list/list.module.js';
import { TagModule } from './modules/tag/tag.module.js';
import { TaskModule } from './modules/task/task.module.js';
import { SubTaskModule } from './modules/sub-task/sub-task.module.js';
import { ReminderModule } from './modules/reminder/reminder.module.js';
import { StatisticsModule } from './modules/statistics/statistics.module.js';
import { SearchModule } from './modules/search/search.module.js';
import { HealthModule } from './modules/health/health.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    // Winston 全局日志
    WinstonModule.forRoot(winstonConfig),
    DatabaseModule,
    AuthModule,
    UserModule,
    ListModule,
    TagModule,
    TaskModule,
    SubTaskModule,
    ReminderModule,
    StatisticsModule,
    SearchModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
