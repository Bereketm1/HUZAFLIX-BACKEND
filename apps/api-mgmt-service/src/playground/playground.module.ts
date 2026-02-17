import { CommonModule } from '@huzaflix/common';
import { Module } from '@nestjs/common';
import { PlaygroundService } from './service/playground/playground.service';
import { ApiModule } from 'src/api/api.module';
import { PlaygroundController } from './controller/playground/playground.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKey } from 'src/api/entities/api-key.entity';

@Module({
  imports: [CommonModule, ApiModule, TypeOrmModule.forFeature([ApiKey])],
  providers: [PlaygroundService],
  controllers: [PlaygroundController],
})
export class PlaygroundModule {}
