import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum EventType {
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
  // Additional application-level events
  USER_LOGIN = 'user.login',
  USER_REGISTER = 'user.register',
  PASSWORD_RESET = 'password.reset',
  API_KEY_CREATED = 'api_key.created',
  API_KEY_DELETED = 'api_key.deleted',
  SUBSCRIPTION_CREATED = 'subscription.created',
  SUBSCRIPTION_CANCELED = 'subscription.canceled',
}

@Entity({ name: 'audit_log' })
export class AuditLog {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'bigint', name: 'actor_id' })
  actor_id: string;

  @Column({ type: 'enum', enum: EventType })
  event: EventType;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'resource_type',
    nullable: true,
  })
  resource_type?: string;

  @Column({ type: 'bigint', name: 'resource_id', nullable: true })
  resource_id?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown> | null;

  @Column({ type: 'inet', name: 'ip_address', nullable: true })
  ip_address?: string;

  @Column({ type: 'text', name: 'user_agent', nullable: true })
  user_agent?: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'timestamp' })
  timestamp: Date;
}
