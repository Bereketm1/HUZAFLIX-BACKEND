import { DynamicModule, Global, Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions, JwtService } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { initCommonSingletons } from './internal/singletons';
import { MinioService } from './services/minio/minio.service';

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
  ): DynamicModule {
    initCommonSingletons(options, redisOptions, minioOptions);

    return {
      module: CommonModule,
      imports: [
        JwtModule.register(options),
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
        MinioService,
        {
          provide: 'JWT_SERVICE',
          useExisting: JwtService,
        },
      ],
      exports: [
        JwtModule,
        MinioService,
        'JWT_SERVICE',
        ...(redisOptions ? [ClientsModule] : []),
      ],
    };
  }
}
