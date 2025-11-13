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
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'base_path',
    unique: true,
    nullable: false,
  })
  base_path: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  version: string;

  @Column({ type: 'enum', enum: ApiStatus, default: ApiStatus.DRAFT })
  status: ApiStatus;

  @Column({
    type: 'varchar',
    length: 512,
    name: 'openapi_spec_key',
    unique: true,
    nullable: true,
  })
  openapi_spec_key: string;

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
