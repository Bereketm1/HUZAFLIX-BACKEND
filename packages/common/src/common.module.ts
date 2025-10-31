import { DynamicModule, Global, Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions, JwtService } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { initCommonSingletons } from './internal/singletons';

@Global()
@Module({})
export class CommonModule {
  static forRoot(
    options: JwtModuleOptions,
    redisOptions: { host: string; port: number },
  ): DynamicModule {
    initCommonSingletons(options);

    return {
      module: CommonModule,
      imports: [
        JwtModule.register(options),
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
      ],
      providers: [
        {
          provide: 'JWT_SERVICE',
          useExisting: JwtService,
        },
      ],
      exports: [JwtModule, ClientsModule, 'JWT_SERVICE'],
    };
  }
}
