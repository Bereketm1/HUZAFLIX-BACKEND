import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { ProxyController } from './proxy/proxy.controller';
import { ProxyService } from './proxy/proxy.service';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
  ],
  controllers: [AppController, ProxyController],
  providers: [AppService, ProxyService],
})
export class AppModule {}
