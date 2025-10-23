import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from 'src/users/users.module';
import { RolesModule } from 'src/roles/roles.module';
import { SessionsModule } from 'src/sessions/sessions.module';
import { AbilityFactory } from './ability.factory';

@Module({
  imports: [
    UsersModule,
    RolesModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        // runtime check: ensure JWT_SECRET is configured so sign/verify do not fail at request time
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
    SessionsModule,
  ],
  providers: [AuthService, AbilityFactory],
  exports: [AbilityFactory],
  controllers: [AuthController],
})
export class AuthModule {}
