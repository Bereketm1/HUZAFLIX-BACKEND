import { AppDataSource } from '../data-source';
import { Role } from 'src/roles/roles.entity';

export async function seedRoles() {
  const roleRepository = AppDataSource.getRepository(Role);

  const roles = [
    { name: 'admin', description: 'Administrator with full access' },
    { name: 'user', description: 'Regular user with limited access' },
    { name: 'moderator', description: 'Can moderate content' },
  ];

  for (const role of roles) {
    const existing = await roleRepository.findOne({
      where: { name: role.name },
    });
    if (!existing) {
      await roleRepository.save(role);
      console.log(`Seeded role: ${role.name}`);
    } else {
      console.log(`Role already exists: ${role.name}`);
    }
  }
}
