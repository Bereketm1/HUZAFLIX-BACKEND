import { DynamicModule, Global, Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions, JwtService } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { initCommonSingletons } from './internal/singletons';

@Global()
@Module({})
export class CommonModule {
  static forRoot(options: JwtModuleOptions): DynamicModule {
    // Initialize internal singletons for DI-less access
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
              host: process.env.REDIS_HOST || 'localhost',
              port: parseInt(process.env.REDIS_PORT || '6379', 10),
            },
          },
          {
            name: 'USER_SERVICE',
            transport: Transport.REDIS,
            options: {
              host: process.env.REDIS_HOST || 'localhost',
              port: parseInt(process.env.REDIS_PORT || '6379', 10),
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
