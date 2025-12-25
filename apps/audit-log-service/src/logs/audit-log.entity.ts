import { AuditActor, AuditEvent } from '@huzaflix/common';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'audit_logs' })
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'timestamp' })
  timestamp!: Date;

  @Column({ type: 'enum', enum: AuditActor })
  actor!: AuditActor;

  @Column({ type: 'enum', enum: AuditEvent })
  event!: AuditEvent;

  @Column({ type: 'int' })
  status!: number;

  @Column({ type: 'inet', name: 'ip_address', nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;
}
