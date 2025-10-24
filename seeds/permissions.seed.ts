import { AppDataSource } from '../data-source';
import { Permission } from 'src/roles/permission.entity';
import { Role } from 'src/roles/roles.entity';
import { RolePermission } from 'src/roles/role-permission.entity';

export async function seedPermissions() {
  const permRepo = AppDataSource.getRepository(Permission);
  const roleRepo = AppDataSource.getRepository(Role);
  const rpRepo = AppDataSource.getRepository(RolePermission);

  // define basic permissions
  const perms = [
    { name: 'all:manage' },
    { name: 'users:create' },
    { name: 'users:read' },
    { name: 'users:update' },
    { name: 'users:delete' },
    { name: 'apis:read' },
  ];

  // ensure permissions exist
  for (const p of perms) {
    let existing = await permRepo.findOne({ where: { name: p.name } });
    if (!existing) {
      existing = await permRepo.save(p as Permission);
      console.log(`Seeded permission: ${p.name}`);
    }
  }

  // assign permissions to roles
  const admin = await roleRepo.findOne({ where: { name: 'administrator' } });
  const user = await roleRepo.findOne({ where: { name: 'api_consumer' } });

  if (admin) {
    const allPerm = await permRepo.findOne({ where: { name: 'all:manage' } });
    if (allPerm) {
      const existing = await rpRepo.findOne({
        where: { role: { id: admin.id }, permission: { id: allPerm.id } },
        relations: ['role', 'permission'],
      });
      if (!existing) {
        await rpRepo.save({
          role: admin,
          permission: allPerm,
        } as RolePermission);
        console.log(`Assigned all:manage to admin`);
      }
    }
  }

  if (user) {
    const apisRead = await permRepo.findOne({ where: { name: 'apis:read' } });
    if (apisRead) {
      const existing = await rpRepo.findOne({
        where: { role: { id: user.id }, permission: { id: apisRead.id } },
        relations: ['role', 'permission'],
      });
      if (!existing) {
        await rpRepo.save({
          role: user,
          permission: apisRead,
        } as RolePermission);
        console.log(`Assigned apis:read to user`);
      }
    }
  }
}
