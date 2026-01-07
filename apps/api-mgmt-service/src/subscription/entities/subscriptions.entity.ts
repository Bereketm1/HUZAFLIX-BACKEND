import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SubscriptionPlan } from './plans.entity';
import { Api } from 'src/api/entities/api.entity';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  PAST_DUE = 'past_due',
}

@Entity({ name: 'subscriptions' })
export class Subscription {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Api)
  @JoinColumn({ name: 'api_id' })
  api: Api;

  @Column({ type: 'bigint' })
  api_id: number;

  @Column({ type: 'bigint', nullable: true })
  user_id: number;

  @ManyToOne(() => SubscriptionPlan)
  @JoinColumn({ name: 'plan_id' })
  plan: SubscriptionPlan;

  @Column({ type: 'bigint' })
  plan_id: number;

  @Column({ type: 'timestamptz', nullable: false })
  start_date: Date;

  @Column({ type: 'timestamptz', nullable: false })
  end_date: Date;

  @Column({ type: 'boolean', default: false })
  auto_renew: boolean;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    nullable: false,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column({ type: 'integer', default: 0 })
  calls_used_this_cycle: number;

  @Column({ type: 'timestamptz', nullable: false })
  current_cycle_start: Date;

  @Column({ type: 'timestamptz', nullable: false })
  current_cycle_end: Date;

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'updated_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;
}
