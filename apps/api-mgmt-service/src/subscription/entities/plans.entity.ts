import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PlanStatus {
  INACTIVE = 'inactive',
  ACTIVE = 'active',
}

@Entity({ name: 'subscription_plans' })
export class SubscriptionPlan {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', nullable: false })
  monthly_price: number;

  @Column({ type: 'integer', nullable: false })
  monthly_call_limit: number;

  @Column({ type: 'decimal', nullable: false })
  avg_price_per_call: number;

  @Column({
    type: 'enum',
    enum: PlanStatus,
    nullable: false,
    default: PlanStatus.ACTIVE,
  })
  status: PlanStatus;

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
