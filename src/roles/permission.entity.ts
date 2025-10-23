import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  // stored as 'resource:action' e.g. 'users:create'
  @Column({ unique: true })
  name: string;
}
