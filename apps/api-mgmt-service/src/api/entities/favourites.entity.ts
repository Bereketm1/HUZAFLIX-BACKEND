import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Api } from './api.entity';

@Entity({ name: 'favourites' })
export class Favourite {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', nullable: false })
  userId: number;

  @ManyToOne(() => Api)
  @JoinColumn({ name: 'api_id' })
  api: Api;

  @Column({ type: 'bigint' })
  api_id: number;
}
