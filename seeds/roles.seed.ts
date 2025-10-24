import { AppDataSource } from '../data-source';
import { Role } from 'src/roles/roles.entity';

export async function seedRoles() {
  const roleRepository = AppDataSource.getRepository(Role);

  const roles = [
    {
      name: 'administrator',
      description: 'Responsible for managing the system',
    },
    {
      name: 'api_consumer',
      description:
        'Authenticated API consumers who can subscribe and manage keys',
    },
    {
      name: 'visitor',
      description:
        'Unauthenticated visitors who can view public APIs and marketing content',
    },
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
