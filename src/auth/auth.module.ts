import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { RolesModule } from 'src/roles/roles.module';
import { SessionsModule } from 'src/sessions/sessions.module';
import { AbilityFactory } from './ability.factory';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [UsersModule, RolesModule, SessionsModule, CommonModule],
  providers: [AuthService, AbilityFactory],
  exports: [AbilityFactory],
  controllers: [AuthController],
})
export class AuthModule {}
