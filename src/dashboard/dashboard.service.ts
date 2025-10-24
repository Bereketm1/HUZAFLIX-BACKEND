import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/users.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private apiConsumerQuery() {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('role.name = :roleName', { roleName: 'api_consumer' });
  }

  async totalUsers(): Promise<number> {
    return this.apiConsumerQuery().getCount();
  }

  async newUsersThisMonth(): Promise<number> {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return this.apiConsumerQuery()
      .andWhere('user.createdAt >= :start', { start })
      .getCount();
  }

  async newUsersThisWeek(): Promise<number> {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return this.apiConsumerQuery()
      .andWhere('user.createdAt >= :start', { start })
      .getCount();
  }

  async newUsersToday(): Promise<number> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return this.apiConsumerQuery()
      .andWhere('user.createdAt >= :start', { start })
      .getCount();
  }

  async usersByMonth(
    year: number,
  ): Promise<{ month: number; count: number }[]> {
    const result = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.role', 'role')
      .select('EXTRACT(MONTH FROM user.createdAt)', 'month')
      .addSelect('COUNT(user.id)', 'count')
      .where('role.name = :roleName', { roleName: 'api_consumer' })
      .andWhere('EXTRACT(YEAR FROM user.createdAt) = :year', { year })
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();

    return result.map((r: { month: string; count: string }) => ({
      month: parseInt(r.month, 10),
      count: parseInt(r.count, 10),
    }));
  }

  async latestUsers(limit = 10): Promise<User[]> {
    return this.apiConsumerQuery()
      .orderBy('user.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }
}
