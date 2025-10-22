import { AppDataSource } from '../data-source';
import { Role } from 'src/roles/roles.entity';

async function seedRoles() {
  await AppDataSource.initialize();

  const roles = [
    { name: 'admin', description: 'Administrator with full access' },
    { name: 'user', description: 'Regular user with limited access' },
    { name: 'moderator', description: 'Can moderate content' },
  ];

  const roleRepository = AppDataSource.getRepository(Role);

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

  console.log('Roles seeding completed');
  await AppDataSource.destroy();
}

seedRoles().catch((err) => {
  console.error('Error seeding roles:', err);
  process.exit(1);
});
