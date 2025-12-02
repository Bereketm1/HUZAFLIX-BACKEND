import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentRequest } from './payment-request.entity';
import { randomUUID } from 'crypto';

@Entity({ name: 'transactions' })
export class Transaction {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'uuid', nullable: false })
  reference: string;

  @Column({ type: 'text', nullable: false })
  remote_reference: string;

  @Column({ type: 'bigint', nullable: false })
  userId: number;

  @Column({ type: 'decimal', nullable: false })
  amount: number;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @ManyToOne(() => PaymentRequest)
  @JoinColumn({ name: 'payment_request_id' })
  payment_request: PaymentRequest;

  @Column({ type: 'bigint' })
  payment_request_id: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;

  @BeforeInsert()
  generateReference() {
    if (!this.reference) {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const random = randomUUID().split('-')[0].toUpperCase();
      this.reference = `TXN-${date}-${random}`;
    }
  }
}
