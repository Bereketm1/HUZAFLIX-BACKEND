import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKey } from './entities/api-key.entity';
import { ConsumerApiKeyService } from './services/consumer-api-key/consumer-api-key.service';
import { ConsumerApiKeyController } from './controllers/consumer-api-key/consumer-api-key.controller';
import { CommonModule } from '@huzaflix/common';
import { ActivityLogModule } from './activity-log/activity-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([ApiKey]), CommonModule, ActivityLogModule],
  providers: [ConsumerApiKeyService],
  controllers: [ConsumerApiKeyController],
  exports: [ConsumerApiKeyService],
})
export class ConsumerApiKeyModule {}
