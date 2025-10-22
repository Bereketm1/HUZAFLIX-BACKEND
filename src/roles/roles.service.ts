import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './roles.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly userRepository: Repository<Role>,
  ) {}

  async findOneByName(name: string): Promise<Role> {
    const role = await this.userRepository.findOne({ where: { name } });
    if (!role) throw new NotFoundException(`Role with name, ${name} not found`);
    return role;
  }
}
