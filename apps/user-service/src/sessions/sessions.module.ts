import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './sessions.entity';
import { SessionsService } from './sessions.service';
import { SessionMessageController } from './session.message.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Session])],
  providers: [SessionsService],
  exports: [SessionsService],
  controllers: [SessionMessageController],
})
export class SessionsModule {}
