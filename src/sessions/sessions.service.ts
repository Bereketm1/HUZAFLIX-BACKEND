import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './sessions.entity';

export type CreateSessionDto = {
  user: Session['user'];
  jti?: Session['jti'];
  token?: Session['token'];
  type: Session['type'];
  expiresAt?: Session['expiresAt'];
  usedAt?: Session['usedAt'];
  revoked?: Session['revoked'];
};

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly repo: Repository<Session>,
  ) {}

  /**
   * Create a new session record. The input must contain all required
   * session columns (except auto-generated primary key and timestamps).
   */
  async create(session: CreateSessionDto): Promise<Session> {
    const s = this.repo.create(session as Session);
    return await this.repo.save(s);
  }

  /**
   * Save (insert or update) a session entity. Use this when you have an
   * existing session id and want to persist changes.
   */
  async save(session: Session): Promise<Session> {
    return await this.repo.save(session);
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
