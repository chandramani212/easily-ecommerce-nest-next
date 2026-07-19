import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

// Last-resort process guards. Background work (long-running catalog imports,
// fire-and-forget progress writes) can produce a stray rejection or throw; under
// Node's default policy an unhandled rejection/exception terminates the process,
// which would take the whole API — and every admin route that depends on it —
// down. Log loudly and keep serving instead of crashing. Per-run failures are
// still recorded on their run row by the runner's own error handling.
const processLogger = new Logger('Process');
process.on('unhandledRejection', (reason) => {
  processLogger.error(
    `Unhandled promise rejection (kept process alive): ${
      reason instanceof Error ? (reason.stack ?? reason.message) : String(reason)
    }`,
  );
});
process.on('uncaughtException', (err) => {
  processLogger.error(
    `Uncaught exception (kept process alive): ${err.stack ?? err.message}`,
  );
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const config = app.get(ConfigService);

  const webOrigin = config.get<string>('WEB_ORIGIN') ?? 'http://localhost:3000';
  const adminOrigin =
    config.get<string>('ADMIN_ORIGIN') ?? 'http://localhost:3002';

  app.enableCors({
    origin: [webOrigin, adminOrigin],
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

  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Easily API')
    .setDescription('Easily admin + storefront backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(config.get<string>('PORT')) || 3001;
  await app.listen(port);
  logger.log(`Application running on http://localhost:${port}`);
  logger.log(`Swagger docs available at http://localhost:${port}/api/docs`);
}

void bootstrap();
