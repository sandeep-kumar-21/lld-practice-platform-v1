import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { AppExceptionFilter } from './common/filters/app-exception.filter.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, new ExpressAdapter());

  // Enable CORS for Next.js frontend
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL || '',
    ].filter(Boolean),
    credentials: true,
  });

  // Global DTO Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global Exception Filter for consistent error shapes
  app.useGlobalFilters(new AppExceptionFilter());

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('LLD Practice Platform API')
    .setDescription(
      'REST API for Low-Level Design (LLD) practice, asynchronous evaluation queue with Redis & BullMQ, and learner progress tracking.',
    )
    .setVersion('1.0')
    .addTag('Problems', 'Problem catalog and specifications')
    .addTag('Attempts', 'Practice attempts management with duplicate guard')
    .addTag('Submissions', 'Async solution submission and polling')
    .addTag('Users', 'Learner attempt history & recurring weaknesses analytics')
    .addTag('Health', 'System readiness probe for MySQL and Redis')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.API_PORT) || 4000;
  await app.listen(port);
  logger.log(`Server successfully started on http://localhost:${port}`);
  logger.log(`Swagger documentation available at http://localhost:${port}/api/docs`);
}

bootstrap();
