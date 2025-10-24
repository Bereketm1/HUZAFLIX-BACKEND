import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: (() => {
          const s = configService.get<string>('JWT_SECRET');
          if (!s)
            throw new Error(
              'JWT_SECRET is not configured. Set JWT_SECRET in your environment',
            );
          return s;
        })(),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  exports: [JwtModule],
})
export class CommonModule {}
