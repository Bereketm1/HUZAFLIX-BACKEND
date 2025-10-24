import { User } from 'src/users/users.entity';
import { RolePermission } from './role-permission.entity';
import { Permission } from './permission.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false })
  name: string;

  @Column({ nullable: true })
  description?: string;

  @OneToMany(() => User, (user) => user.role)
  users: User[];

  @OneToMany(() => RolePermission, (rp) => rp.role, { cascade: false })
  rolePermissions?: RolePermission[];

  /**
   * Convenience computed property that returns the list of permissions
   * for this role by mapping the rolePermissions relation.
   * Note: callers should ensure `rolePermissions` is loaded when using this.
   */
  get permissions(): Permission[] | undefined {
    return this.rolePermissions?.map((rp) => rp.permission);
  }

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
