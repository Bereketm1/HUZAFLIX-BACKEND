import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/users/users.entity';

export type SessionType = 'refresh' | 'reset' | 'access' | 'otp';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'integer', nullable: true })
  jti?: number | null;

  @Column({ type: 'text', nullable: true })
  token?: string | null;

  @Column({ type: 'text', nullable: false })
  type: SessionType;

  @Column({ type: 'timestamptz', nullable: true })
  expires_at?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  used_at?: Date | null;

  @Column({ type: 'boolean', default: false })
  revoked: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
