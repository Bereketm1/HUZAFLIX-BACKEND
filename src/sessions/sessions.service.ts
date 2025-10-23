import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './sessions.entity';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly repo: Repository<Session>,
  ) {}

  async create(session: Partial<Session>): Promise<Session> {
    const s = this.repo.create(session as Session);
    return await this.repo.save(s);
  }

  async findByJti(jti: number): Promise<Session> {
    const s = await this.repo.findOne({ where: { jti } });
    if (!s) throw new NotFoundException('Session not found');
    return s;
  }

  async findByToken(token: string): Promise<Session> {
    const s = await this.repo.findOne({ where: { token } });
    if (!s) throw new NotFoundException('Session not found');
    return s;
  }

  async markUsed(id: number): Promise<void> {
    await this.repo.update({ id }, { usedAt: new Date() } as Partial<Session>);
  }

  async revoke(id: number): Promise<void> {
    await this.repo.update({ id }, { revoked: true } as Partial<Session>);
  }
}
