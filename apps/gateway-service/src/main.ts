import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.setGlobalPrefix('api', {
    exclude: ['metrics'],
  });

  const services = {
    '/api/auth': `http://user-service:${process.env.USER_SERVICE_PORT || 3000}`,
    '/api/analytics': `http://analytics-service:${process.env.ANALYTICS_SERVICE_PORT || 3000}`,
    '/api/api-management': `http://api-mgmt-service:${process.env.API_MANAGEMENT_SERVICE_PORT || 3000}`,
  };

  for (const [route, target] of Object.entries(services)) {
    app.use(
      route,
      createProxyMiddleware({
        target,
        changeOrigin: true,
        pathRewrite: (path) => path,
      }),
    );
  }

  await app.listen(3000);
  console.log('🚀 Gateway running on http://localhost:3000');
}
void bootstrap();
