import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { RolesModule } from 'src/roles/roles.module';
import { SessionsModule } from 'src/sessions/sessions.module';
import { AuditService } from 'src/audit/audit.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    UsersModule,
    RolesModule,
    SessionsModule,
    ClientsModule.register([
      {
        name: 'SUBSCRIPTION_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
        },
      },
    ]),
  ],
  providers: [AuthService, AuditService],
  controllers: [AuthController],
})
export class AuthModule {}
