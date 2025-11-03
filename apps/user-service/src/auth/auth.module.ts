import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { RolesModule } from 'src/roles/roles.module';
import { SessionsModule } from 'src/sessions/sessions.module';

@Module({
  imports: [UsersModule, RolesModule, SessionsModule],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
