import { JwtService, JwtModuleOptions } from '@nestjs/jwt';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';

let jwtServiceInstance: JwtService | null = null;
let sessionClientInstance: ClientProxy | null = null;

function redisOptionsFromEnv() {
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  };
}

export function initCommonSingletons(options: JwtModuleOptions): void {
  // Create a standalone JwtService without DI
  jwtServiceInstance = new JwtService(options);

  const redis = redisOptionsFromEnv();
  // Create a standalone microservice client using Redis transport to match app
  sessionClientInstance = ClientProxyFactory.create({
    transport: Transport.REDIS,
    options: {
      host: redis.host,
      port: redis.port,
    },
  });
}

export function getJwtServiceSingleton(): JwtService | null {
  return jwtServiceInstance;
}

export function getSessionClientSingleton(): ClientProxy | null {
  return sessionClientInstance;
}

export function getUserClientSingleton(): ClientProxy | null {
  // Reuse the same Redis client for user messages
  return sessionClientInstance;
}


