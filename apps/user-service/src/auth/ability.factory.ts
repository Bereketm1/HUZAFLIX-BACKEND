import { Injectable } from '@nestjs/common';
import { AbilityBuilder, Ability, AbilityClass } from '@casl/ability';
import { PermissionsService } from 'src/roles/permissions.service';
import { Permission } from 'src/roles/permission.entity';

export type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete';
export type Subjects = string;

export type AppAbility = Ability<[Actions, Subjects]>;

@Injectable()
export class AbilityFactory {
  constructor(private readonly permissionsService: PermissionsService) {}

  async createForRole(roleId: number): Promise<AppAbility> {
    const permissions: Permission[] =
      await this.permissionsService.getPermissionsForRole(roleId);

    const { can, build } = new AbilityBuilder(
      Ability as AbilityClass<AppAbility>,
    );

    // If role has a permission 'all:manage' grant full manage
    const permNames = permissions.map((p) => p.name);
    if (permNames.includes('all:manage')) {
      can('manage', 'all');
      return build();
    }

    // Parse permission names like 'resource:action'
    for (const p of permissions) {
      const [resource, action] = p.name.split(':');
      if (!resource || !action) continue;
      // map action to CASL action keywords; trust stored action values
      can(action as Actions, resource);
    }
    return build();
  }
}
