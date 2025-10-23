import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolePermission } from './role-permission.entity';
import { Permission } from './permission.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(RolePermission)
    private readonly rolePermRepo: Repository<RolePermission>,
    @InjectRepository(Permission)
    private readonly permRepo: Repository<Permission>,
  ) {}

  async getPermissionsForRole(roleId: number): Promise<Permission[]> {
    // join role_permissions -> permissions to return permission rows
    const rows = await this.rolePermRepo.find({
      where: { role: { id: roleId } },
      relations: ['permission'],
    });
    return rows.map((r) => r.permission);
  }
}
