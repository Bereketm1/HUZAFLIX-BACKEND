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
    .setTitle('Huzaflix User Services API Documentation')
    .setDescription('API documentation for Huzaflix Backend')
    .setVersion('1.0')
    .addServer(
      `https://${process.env.SERVER_HOST || 'api.huzaflix.com'}/auth`,
      'Production',
    )
    .addServer('http://localhost:3000/api/auth', 'Local Development')
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

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  await app.listen(process.env.APP_PORT || 3000);
}
void bootstrap();
