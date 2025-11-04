import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  CommonModule,
  JwtAuthGuard,
  RefreshGuard,
  ResetGuard,
  RolesGuard,
} from '@huzaflix/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { JwtModuleOptions } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

export type RedisClient = Redis;

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
});

const jwtOptions: JwtModuleOptions = {
  secret: 'defaultSecret',
  signOptions: { expiresIn: '1h' },
};

@Module({
  imports: [
    PrometheusModule.register(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    ClientsModule.register([
      {
        name: 'DASHBOARD_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
        },
      },
    ]),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: parseInt(process.env.THROTTLER_TTL || '60000', 10),
          limit: parseInt(process.env.THROTTLER_LIMIT || '100', 10),
        },
      ],
      storage: new ThrottlerStorageRedisService(redisClient),
    }),
    CacheModule.register({
      store: redisStore,
      redisInstance: redisClient,
      ttl: parseInt(process.env.CACHE_TTL || '60000', 10),
      isGlobal: true,
    }),
    CommonModule.forRoot(jwtOptions, {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    JwtAuthGuard,
    RefreshGuard,
    ResetGuard,
    RolesGuard,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
