import { NestFactory } from '@nestjs/core';
import { ValidationPipe, ShutdownSignal } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 全局使用 Winston 日志
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', 'http://localhost:5173'),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // 优雅关闭
  app.enableShutdownHooks([ShutdownSignal.SIGINT, ShutdownSignal.SIGTERM]);

  const port = configService.get<number>('PORT', 3000);
  const server = await app.listen(port);

  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  logger.log(`Server running on http://localhost:${port}`, 'Bootstrap');

  // 确保 HTTP 连接排空
  for (const signal of ['SIGINT', 'SIGTERM'] as NodeJS.Signals[]) {
    process.on(signal, async () => {
      logger.warn(`Received ${signal}, shutting down gracefully...`, 'Bootstrap');
      await app.close();
      server.close(() => process.exit(0));
    });
  }
}

void bootstrap();
