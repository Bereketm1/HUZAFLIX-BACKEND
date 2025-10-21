import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const dataSource = app.get(DataSource);
  try {
    await dataSource.query('SELECT NOW()');
    console.log('✅ Database connected successfully!');
  } catch (err) {
    console.error('❌ Database connection failed:', (err as Error).message);
  }

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('HuzaFlix API')
    .setDescription('HuzaFlix backend API documentation')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.APP_PORT || 3000);
}
void bootstrap();
