import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from '@huzaflix/common';
import { DashboardModule } from './dashboard/dashboard.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { JwtModuleOptions } from '@nestjs/jwt';

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
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      username: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      database: process.env.POSTGRES_DB || 'postgres',
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
    }),
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
    RolesModule,
    UsersModule,
    AuthModule,
    CommonModule.forRoot(jwtOptions),

    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
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
