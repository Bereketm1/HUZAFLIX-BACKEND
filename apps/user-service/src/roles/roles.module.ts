import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './roles.entity';
import { RolesService } from './roles.service';
import { Permission } from './permission.entity';
import { RolePermission } from './role-permission.entity';
import { PermissionsService } from './permissions.service';
import { RolesController } from './roles.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission, RolePermission])],
  providers: [RolesService, PermissionsService],
  exports: [RolesService, PermissionsService],
  controllers: [RolesController],
})
export class RolesModule {}
