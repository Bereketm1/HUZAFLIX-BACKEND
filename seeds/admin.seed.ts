import { AppDataSource } from '../data-source';
import { User } from 'src/users/users.entity';
import { Role } from 'src/roles/roles.entity';
import * as bcrypt from 'bcryptjs';

export async function seedAdmins() {
  const userRepository = AppDataSource.getRepository(User);
  const roleRepository = AppDataSource.getRepository(Role);

  // Find administrator role
  const adminRole = await roleRepository.findOne({
    where: { name: 'administrator' },
  });

  if (!adminRole) {
    console.error('Administrator role not found. Please seed roles first.');
    return;
  }

  const admins = [
    { email: 'admin1@example.com', password: 'Admin@123' },
    { email: 'admin2@example.com', password: 'Admin@123' },
    { email: 'admin3@example.com', password: 'Admin@123' },
  ];

  for (const admin of admins) {
    const existing = await userRepository.findOne({
      where: { email: admin.email },
    });

    if (!existing) {
      const hashedPassword = await bcrypt.hash(admin.password, 10);
      const user = userRepository.create({
        email: admin.email,
        password_hash: hashedPassword,
        role: adminRole,
      });
      await userRepository.save(user);
      console.log(`Seeded admin: ${admin.email}`);
    } else {
      console.log(`Admin already exists: ${admin.email}`);
    }
  }
}
