import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './roles.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { paginate, PaginatedResponse } from '@huzaflix/common';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async findOneByName(name: string): Promise<Role> {
    const role = await this.roleRepository.findOne({ where: { name } });
    if (!role) throw new NotFoundException(`Role with name, ${name} not found`);
    return role;
  }

  async findAll({
    page,
    limit,
  }: {
    page?: number;
    limit?: number;
  }): Promise<{ data: Role[]; meta: PaginatedResponse } | Role[]> {
    if (!page || !limit) {
      return this.roleRepository.find();
    }
    const [roles, total] = await this.roleRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });

    return paginate(roles, page, limit, total);
  }

  async findOneById(id: number): Promise<Role> {
    const role = await this.roleRepository.findOneById(id);
    if (!role) throw new NotFoundException(`Role with name, ${id} not found`);
    return role;
  }

  async create(dto: CreateRoleDto): Promise<Role> {
    const role = this.roleRepository.create(dto);
    return this.roleRepository.save(role);
  }

  async update(id: number, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.roleRepository.findOneById(id);
    if (!role) throw new NotFoundException(`Role with id, ${id} not found`);
    this.roleRepository.merge(role, dto);
    return this.roleRepository.save(role);
  }

  async delete(id: number): Promise<Role> {
    const role = await this.roleRepository.findOneById(id);
    if (!role) throw new NotFoundException(`Role with id, ${id} not found`);
    await this.roleRepository.remove(role);
    return role;
  }
}
