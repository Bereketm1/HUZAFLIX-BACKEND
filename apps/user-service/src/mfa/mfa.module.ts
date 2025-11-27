import { Module } from '@nestjs/common';
import { MfaController } from './mfa.controller';
import { MfaService } from './mfa.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mfa } from './mfa.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Mfa])],
  controllers: [MfaController],
  providers: [MfaService],
})
export class MfaModule {}
