import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '@huzaflix/common';
import { SubscriptionService } from 'src/subscription/services/subscription/subscription.service';
import { CreateSubscriptionDto } from 'src/subscription/dto/subscription/subscription-create.dto';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  @ApiOperation({ summary: 'Get all subscriptions' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator', 'api_consumer')
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Fetched all subscriptions successfully',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?: { id: number; role: { name: string } },
  ) {
    return await this.subscriptionService.findAll(
      { page, limit },
      user?.id as number,
      user?.role?.name as string,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription by ID' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Fetched subscription successfully',
  })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user?: { id: number; role: { name: string } },
  ) {
    return await this.subscriptionService.findOne(
      Number(id),
      user?.id as number,
      user?.role?.name as string,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create subscription' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('api_consumer')
  @ApiResponse({
    status: 201,
    description: 'Subscription created successfully',
  })
  async create(
    @Body() dto: CreateSubscriptionDto,
    @CurrentUser() user: { id: number },
  ) {
    return await this.subscriptionService.create(dto, user.id);
  }

  @Post(':id/increment')
  @ApiOperation({ summary: 'Increment subscription usage' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('api_consumer')
  @ApiResponse({ status: 200, description: 'Subscription usage incremented' })
  async incrementUsage(
    @Param('id') id: string,
    @CurrentUser() user: { id: number },
  ) {
    return await this.subscriptionService.incrementUsage(Number(id), user.id);
  }

  @Post(':id/renew')
  @ApiOperation({ summary: 'Renew subscription' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('api_consumer')
  @ApiResponse({
    status: 200,
    description: 'Subscription renewed successfully',
  })
  async renew(@Param('id') id: string, @CurrentUser() user: { id: number }) {
    return await this.subscriptionService.renew(Number(id), user.id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('api_consumer')
  @ApiResponse({
    status: 200,
    description: 'Subscription cancelled successfully',
  })
  async cancel(@Param('id') id: string, @CurrentUser() user: { id: number }) {
    return await this.subscriptionService.cancel(Number(id), user.id);
  }
}
