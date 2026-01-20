import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './audit-log.entity';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';
import { IngestApiKeyGuard } from './guards/ingest-api-key.guard';
import { CommonModule } from '@huzaflix/common';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog]),
    CommonModule.forRoot(
      { secret: process.env.JWT_SECRET || 'defaultSecret' },
      {
        host: process.env.REDIS_HOST || 'redis',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    ),
  ],
  controllers: [LogsController],
  providers: [LogsService, IngestApiKeyGuard],
})
export class LogsModule {}
