import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Api } from 'src/api/entities/api.entity';
import { ApiModule } from 'src/api/api.module';
import { ProxyController } from './controller/proxy.controller';
import { ProxyService } from './service/proxy.service';

@Module({
  imports: [TypeOrmModule.forFeature([Api]), ApiModule],
  controllers: [ProxyController],
  providers: [ProxyService],
})
export class ProxyModule {}
