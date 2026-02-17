import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Api } from './api.entity';

export enum KeyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity({ name: 'api_keys' })
export class ApiKey {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'bigint', name: 'user_id', nullable: false })
  user_id: string;

  @ManyToOne(() => Api, (api) => api.apiKeys, { eager: true })
  @JoinColumn({ name: 'api_id' })
  api: Api;

  @Column({ type: 'bytea', unique: true, name: 'key_hash' })
  key_hash: Buffer;

  @Column({ type: 'char', length: 8, name: 'key_prefix' })
  key_prefix: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name?: string | null;

  @Column({ type: 'timestamptz', name: 'expires_at', nullable: true })
  expires_at?: Date | null;

  @Column({ type: 'enum', enum: KeyStatus, default: KeyStatus.ACTIVE })
  status: KeyStatus;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @Column({ type: 'timestamptz', name: 'revoked_at', nullable: true })
  revoked_at?: Date | null;
}
