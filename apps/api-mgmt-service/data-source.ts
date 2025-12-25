import { DataSource } from 'typeorm';
import 'dotenv/config';
import { Api } from 'src/api/entities/api.entity';
import { ApiKey } from 'src/api/entities/api-key.entity';
import { SubscriptionPlan } from 'src/subscription/entities/plans.entity';
import { Subscription } from 'src/subscription/entities/subscriptions.entity';
import { Favourite } from 'src/api/entities/favourites.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'postgres',
  entities: [Api, ApiKey, SubscriptionPlan, Subscription, Favourite],
  migrations: ['./migrations/*.ts'],
  synchronize: false,
});
