import { Module } from '@nestjs/common';
import { User } from './users.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { RolesModule } from 'src/roles/roles.module';
import { UsersController } from './users.controller';
import { SessionsModule } from 'src/sessions/sessions.module';
import { CommonModule } from '@huzaflix/common';
import { UserMessageController } from './user.message.controller';

@Module({
  imports: [
    SessionsModule,
    RolesModule,
    TypeOrmModule.forFeature([User]),
    CommonModule,
  ],
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController, UserMessageController],
})
export class UsersModule {}
