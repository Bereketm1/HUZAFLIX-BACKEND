import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('api_request_logs')
export class ApiRequestLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  api_key: string;

  @Column()
  path: string;

  @Column()
  method: string;

  @Column()
  status_code: number;

  @Column()
  duration_ms: number;

  @Column({ nullable: true })
  user_id: number;

  @CreateDateColumn()
  timestamp: Date;
}
