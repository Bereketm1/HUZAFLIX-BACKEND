import { Body, Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MinioService } from '@huzaflix/common';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly minioService: MinioService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
