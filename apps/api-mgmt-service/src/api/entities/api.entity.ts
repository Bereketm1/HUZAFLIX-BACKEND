import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiKey } from './api-key.entity';

export enum ApiStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

@Entity({ name: 'apis' })
export class Api {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  slug: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    default: 'Huzalabs',
  })
  company_name: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    default: 'info@huzalabs.com',
  })
  company_contact_email: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    default: '+1234567890',
  })
  company_contact_phone: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 255 })
  category: string;

  @Column('text', { array: true, nullable: true })
  tags: string[];

  @Column({
    type: 'varchar',
    length: 255,
    name: 'base_path',
    unique: true,
    nullable: false,
  })
  base_path: string;

  @Column({
    type: 'text',
    name: 'base_api_key',
  })
  base_api_key: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  version: string;

  @Column({ type: 'enum', enum: ApiStatus, default: ApiStatus.DRAFT })
  status: ApiStatus;

  @Column({
    type: 'varchar',
    length: 1024,
    name: 'openapi_spec_url',
    nullable: true,
  })
  openapi_spec_url: string;

  @Column({ type: 'bigint', name: 'created_by', nullable: false })
  created_by: string;

  @Column({ type: 'timestamptz', name: 'published_at', nullable: true })
  published_at?: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;

  @OneToMany(() => ApiKey, (apiKey) => apiKey.api)
  apiKeys: ApiKey[];
}
