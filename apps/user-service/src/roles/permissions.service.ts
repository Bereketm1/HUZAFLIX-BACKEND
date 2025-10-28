import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './roles.entity';
import { Permission } from './permission.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permRepo: Repository<Permission>,
  ) {}

  async getPermissionsForRole(roleId: number): Promise<Permission[]> {
    // Load the role with its rolePermissions -> permission relation.
    // The Role entity exposes a computed `permissions` getter which
    // maps rolePermissions -> permission so callers can use entity-level API.
    const role = await this.roleRepo.findOne({
      where: { id: roleId },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });
    if (!role) throw new NotFoundException('Role not found');
    return role.permissions ?? [];
  }
}
