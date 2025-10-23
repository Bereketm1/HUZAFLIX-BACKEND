import { Injectable } from '@nestjs/common';
import { AbilityBuilder, Ability, AbilityClass } from '@casl/ability';

export type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete';
export type Subjects = string;

export type AppAbility = Ability<[Actions, Subjects]>;

export interface PermissionRecord {
  id: number;
  name: string; // 'resource:action' format, e.g. 'users:create'
}

export interface PermissionsService {
  // fetch permission names assigned to a role id
  getPermissionsForRole(roleId: number): Promise<PermissionRecord[]>;
}

@Injectable()
export class AbilityFactory {
  constructor(private readonly permissionsService: PermissionsService) {}

  async createForRole(roleId: number): Promise<AppAbility> {
    const permissions =
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
