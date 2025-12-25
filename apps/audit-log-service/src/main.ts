import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('HuzaFlix Audit Log Service API')
    .setDescription('Audit log ingestion and authenticated user querying')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste access token here (without the Bearer prefix)',
      },
      'access-token',
    )
    .addServer(
      process.env.NODE_ENV === 'production'
        ? `http://${process.env.SERVER_HOST || 'localhost'}/audit-log`
        : 'http://localhost:3000/api/audit-log',
      'Gateway',
    )
    .build();

  const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, swaggerDoc, {
    jsonDocumentUrl: 'api-docs/json',
  });

  const dataSource = app.get(DataSource);
  try {
    await dataSource.query('SELECT NOW()');

    console.log('✅ Audit Log DB connected');
  } catch (err: unknown) {
    console.error(
      '❌ Audit Log DB connection failed:',
      err instanceof Error ? err.message : String(err),
    );
  }

  // Strict requirement: service listens on port 3000 internally.
  await app.listen(3000);
}

void bootstrap();
