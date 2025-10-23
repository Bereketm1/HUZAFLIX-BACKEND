import { Module } from '@nestjs/common';
import { User } from './users.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { RolesModule } from 'src/roles/roles.module';
import { UsersController } from './users.controller';

@Module({
  imports: [RolesModule, TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
