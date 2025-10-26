import { Module } from '@nestjs/common';
import { User } from './users.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { RolesModule } from 'src/roles/roles.module';
import { UsersController } from './users.controller';
import { CommonModule } from 'src/common/common.module';
import { SessionsModule } from 'src/sessions/sessions.module';

@Module({
  imports: [
    SessionsModule,
    RolesModule,
    TypeOrmModule.forFeature([User]),
    CommonModule,
  ],
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
