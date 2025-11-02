import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { SessionsService } from './sessions.service';

@Controller()
export class SessionMessageController {
  constructor(private readonly sessionService: SessionsService) {}

  @MessagePattern('get_session_by_token')
  async getSessionByToken(token: string) {
    const session = await this.sessionService.findByToken(token);
    return session;
  }
}
