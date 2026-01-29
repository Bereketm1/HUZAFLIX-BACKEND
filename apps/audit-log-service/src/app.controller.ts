import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  @Get()
  getHealth() {
    return {
      success: true,
      status: 200,
      message: 'Request successful',
      response: {
        value: 'Hello World!',
      },
    };
  }
}
