import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/users.entity';
import { CommonModule } from 'src/common/common.module';
import { UsersModule } from 'src/users/users.module';
import { SessionsModule } from 'src/sessions/sessions.module';
import { DashboardMessageController } from './dashboard.message.controller';

@Module({
  imports: [
    SessionsModule,
    UsersModule,
    TypeOrmModule.forFeature([User]),
    CommonModule,
  ],
  controllers: [DashboardMessageController],
  providers: [DashboardService],
})
export class DashboardModule {}
