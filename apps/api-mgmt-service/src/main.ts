import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseInterceptor } from '@huzaflix/common';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const dataSource = app.get(DataSource);
  try {
    await dataSource.query('SELECT NOW()');
    console.log('✅ Database connected successfully!');
  } catch (err) {
    console.error('❌ Database connection failed:', (err as Error).message);
  }

  const config = new DocumentBuilder()
    .setTitle('Huzaflix Analytics Services API Documentation')
    .setDescription('API documentation for Huzaflix Backend')
    .setVersion('1.0')
    .addServer(
      process.env.NODE_ENV === 'production'
        ? `http://${process.env.SERVER_HOST || 'localhost'}/api-management`
        : 'http://localhost:3000/api/api-management',
      'Local Development',
    )
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    jsonDocumentUrl: 'api-docs/json',
  });
  app.useGlobalInterceptors(new ResponseInterceptor());

  app.connectMicroservice({
    transport: Transport.REDIS,
    options: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.APP_PORT || 3000);
}
void bootstrap();
