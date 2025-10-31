import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { UsersService } from './users.service';

@Controller()
export class UserMessageController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern('get_user_by_id')
  async getUserById(id: number) {
    return await this.usersService.findOneById(id);
  }
}
