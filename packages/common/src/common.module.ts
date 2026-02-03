import { DynamicModule, Global, Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions, JwtService } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { initCommonSingletons } from './internal/singletons';
import { MinioService } from './services/minio/minio.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { MfaMailerService } from './services/mfa-mailer/mfa-mailer.service';

@Global()
@Module({})
export class CommonModule {
  static forRoot(
    options: JwtModuleOptions,
    redisOptions?: { host: string; port: number },
    minioOptions?: {
      endpoint: string;
      port: number;
      accessKey: string;
      secretKey: string;
      useSSL?: boolean;
      bucketName?: string;
    },
    mailerOptions?: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    },
  ): DynamicModule {
    initCommonSingletons(options, redisOptions, minioOptions, mailerOptions);

    return {
      module: CommonModule,
      imports: [
        JwtModule.register(options),
        ...(mailerOptions
          ? [
              MailerModule.forRoot({
                transport: {
                  host: mailerOptions.host || 'smtp.example.com',
                  port: mailerOptions.port || 587,
                  secure: mailerOptions.secure || false,
                  auth: {
                    user: mailerOptions.auth?.user || 'your_email@example.com',
                    pass: mailerOptions.auth?.pass || 'your_email_password',
                  },
                },
                defaults: {
                  from: '"No Reply" <noreply@example.com>',
                },
              }),
            ]
          : []),
        ...(redisOptions
          ? [
              ClientsModule.register([
                {
                  name: 'SESSION_SERVICE',
                  transport: Transport.REDIS,
                  options: {
                    host: redisOptions.host,
                    port: redisOptions.port,
                  },
                },
              ]),
            ]
          : []),
      ],
      providers: [
        ...(minioOptions ? [MinioService] : []),
        ...(mailerOptions ? [MfaMailerService] : []),
        {
          provide: 'JWT_SERVICE',
          useExisting: JwtService,
        },
      ],
      exports: [
        JwtModule,
        ...(minioOptions ? [MinioService] : []),
        'JWT_SERVICE',
        ...(mailerOptions ? [MailerModule, MfaMailerService] : []),
        ...(redisOptions ? [ClientsModule] : []),
      ],
    };
  }
}
