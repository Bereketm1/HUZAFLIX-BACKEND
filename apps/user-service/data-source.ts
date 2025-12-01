import { DataSource } from 'typeorm';
import 'dotenv/config';
import { Role } from './src/roles/roles.entity';
import { User } from './src/users/users.entity';
import { Mfa } from 'src/mfa/mfa.entity';
import { Session } from 'src/sessions/sessions.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'postgres',
  entities: [Role, User, Session, Mfa],
  migrations: ['./migrations/*.ts'],
  synchronize: false,
});
