import { User } from 'src/users/users.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false })
  name: string;


  @OneToMany(() => User, (user) => user.role)
  users: User[];

  // timestamps and description were intentionally removed to match DATABASE_SCHEMA.md
}
