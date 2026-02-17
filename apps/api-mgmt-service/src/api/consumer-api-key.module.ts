import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKey } from './entities/api-key.entity';
import { ConsumerApiKeyService } from './services/consumer-api-key/consumer-api-key.service';
import { ConsumerApiKeyController } from './controllers/consumer-api-key/consumer-api-key.controller';
import { CommonModule } from '@huzaflix/common';
import { Api } from './entities/api.entity';
import { Subscription } from 'src/subscription/entities/subscriptions.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApiKey, Api, Subscription]),
    CommonModule,
  ],
  providers: [ConsumerApiKeyService],
  controllers: [ConsumerApiKeyController],
  exports: [ConsumerApiKeyService],
})
export class ConsumerApiKeyModule {}
