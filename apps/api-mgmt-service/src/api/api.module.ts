import { CommonModule, MinioService } from '@huzaflix/common';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Api } from './entities/api.entity';
import { ApiService } from './services/api/api.service';
import { ApiController } from './controllers/api/api.controller';
import { ApiKey } from './entities/api-key.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Api, ApiKey]), CommonModule],
  providers: [ApiService, MinioService],
  controllers: [ApiController],
  exports: [ApiService],
})
export class ApiModule {}
