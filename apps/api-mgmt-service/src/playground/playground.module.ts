import { CommonModule } from '@huzaflix/common';
import { Module } from '@nestjs/common';
import { PlaygroundService } from './service/playground/playground.service';
import { ApiModule } from 'src/api/api.module';
import { PlaygroundController } from './controller/playground/playground.controller';

@Module({
  imports: [CommonModule, ApiModule],
  providers: [PlaygroundService],
  controllers: [PlaygroundController],
})
export class PlaygroundModule {}
