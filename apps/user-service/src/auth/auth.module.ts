import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { RolesModule } from 'src/roles/roles.module';
import { SessionsModule } from 'src/sessions/sessions.module';
import { AuditService } from 'src/audit/audit.service';

@Module({
  imports: [UsersModule, RolesModule, SessionsModule],
  providers: [AuthService, AuditService],
  controllers: [AuthController],
})
export class AuthModule {}
