import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalLogInterceptor } from '@huzaflix/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.setGlobalPrefix('api', {
    exclude: ['metrics'],
  });

  app.useGlobalInterceptors(
    new GlobalLogInterceptor({
      auditServiceUrl: process.env.AUDIT_LOG_SERVICE_URL,
      ingestKey: process.env.AUDIT_LOG_INGEST_KEY,
    }),
  );

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  await app.listen(3000);
  console.log('🚀 Gateway running on http://localhost:3000');
}
void bootstrap();
