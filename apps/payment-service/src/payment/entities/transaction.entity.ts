import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { randomUUID } from 'crypto';

@Entity({ name: 'transactions' })
export class Transaction {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  reference: string;

  @Column({ type: 'bigint', nullable: false })
  userId: number;

  @Column({ type: 'decimal', nullable: false })
  amount: number;

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
