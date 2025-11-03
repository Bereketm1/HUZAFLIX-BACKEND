import { AppDataSource } from '../data-source';
import { seedRoles } from './roles.seed';
import { seedAdmins } from './admin.seed';

async function run() {
  try {
    await AppDataSource.initialize();
    await seedRoles();
    await seedAdmins();
    console.log('Seeding completed');
  } catch (err) {
    console.error('Error running seeds:', err);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

void run();
