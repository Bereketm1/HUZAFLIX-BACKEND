import { JwtService, JwtModuleOptions } from '@nestjs/jwt';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import * as Minio from 'minio';
import { createTransport, Transporter } from 'nodemailer';

let jwtServiceInstance: JwtService | null = null;
let sessionClientInstance: ClientProxy | null = null;
let minioClientInstance: Minio.Client | null = null;
let minioBucketNameInstance: string | null = null;
let mailerInstance: Transporter | null = null;

export function initCommonSingletons(
  options: JwtModuleOptions,
  redis?: { host: string; port: number },
  minio?: {
    endpoint: string;
    port: number;
    accessKey: string;
    secretKey: string;
    useSSL?: boolean;
    bucketName?: string;
  },
  mailer?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  },
): void {
  jwtServiceInstance = new JwtService(options);

  if (minio) {
    minioClientInstance = new Minio.Client({
      endPoint: minio.endpoint,
      port: minio.port,
      useSSL: minio.useSSL ?? false,
      accessKey: minio.accessKey,
      secretKey: minio.secretKey,
    });
    minioBucketNameInstance = minio.bucketName ?? null;
  }

  if (redis) {
    sessionClientInstance = ClientProxyFactory.create({
      transport: Transport.REDIS,
      options: {
        host: redis.host,
        port: redis.port,
      },
    });
  }

  if (mailer) {
    mailerInstance = createTransport({
      host: mailer.host,
      port: mailer.port,
      secure: mailer.secure,
      auth: {
        user: mailer.auth.user,
        pass: mailer.auth.pass,
      },
    });
  }
}

export function getJwtServiceSingleton(): JwtService | null {
  return jwtServiceInstance;
}

export function getSessionClientSingleton(): ClientProxy | null {
  return sessionClientInstance;
}

export function getMinioClientSingleton(): Minio.Client | null {
  return minioClientInstance;
}

export function getMinioBucketNameSingleton(): string | null {
  return minioBucketNameInstance;
}

export function getMailerSingleton(): Transporter | null {
  return mailerInstance;
}
