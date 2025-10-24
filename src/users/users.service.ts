import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';
import { RolesService } from 'src/roles/roles.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly roleService: RolesService,
  ) {}

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async findOneById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role'],
    });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  async findOneByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['role'],
    });
    if (!user)
      throw new NotFoundException(`User with email ${email} not found`);
    return user;
  }

  async create(dto: CreateUserDto): Promise<User> {
    const role = await this.roleService.findOneById(dto.role_id);
    const user = this.userRepository.create({
      ...dto,
      password_hash: dto.password
        ? await this.hashPassword(dto.password)
        : null,
    });
    return await this.userRepository.save({ ...user, role });
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    const role = await this.roleService.findOneById(
      dto.role_id || user?.role.id,
    );
    if (user?.role?.id != dto.role_id) {
      delete dto.role_id;
      Object.assign(user, { ...dto, updated_at: new Date(), role: role });
    } else {
      delete dto.role_id;
      Object.assign(user, { ...dto, updated_at: new Date() });
    }
    return await this.userRepository.save(user);
  }
  async updatePassword(id: number, newPassword: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    user.password_hash = await this.hashPassword(newPassword);
    return await this.userRepository.save(user);
  }

  private async hashPassword(password: string) {
    if (!password)
      throw new UnprocessableEntityException('Password is required');
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }
}
