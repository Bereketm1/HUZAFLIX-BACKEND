import {
  Controller,
  Patch,
  Post,
  Param,
  Body,
  ParseIntPipe,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '@huzaflix/common';
import { ConsumerApiKeyService } from '../../services/consumer-api-key/consumer-api-key.service';
import { CreateConsumerApiKeyDto } from '../../dto/consumer-api-key/create-consumer-api-key.dto';
import { UpdateConsumerApiKeyDto } from '../../dto/consumer-api-key/update-consumer-api-key.dto';

@ApiTags('consumer-api-keys')
@Controller('consumer-api-keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ConsumerApiKeyController {
  constructor(private readonly service: ConsumerApiKeyService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new consumer API key for the logged-in user',
  })
  @ApiResponse({
    status: 201,
    description: 'Created key (one-time returned value)',
  })
  async create(
    @CurrentUser() user: { id?: number | string },
    @Body() dto: CreateConsumerApiKeyDto,
  ) {
    const userId = user?.id as number | string;
    if (!userId) throw new UnauthorizedException('Invalid user');
    return this.service.createForUser(String(userId), dto);
  }

  @Post(':id/activate')
  @ApiOperation({
    summary: 'Activate a consumer API key owned by the logged-in user',
  })
  async activate(
    @CurrentUser() user: { id?: number | string },
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = user?.id as number | string;
    if (!userId) throw new UnauthorizedException('Invalid user');
    return this.service.activateForUser(String(userId), id);
  }

  @Post(':id/deactivate')
  @ApiOperation({
    summary: 'Deactivate a consumer API key owned by the logged-in user',
  })
  async deactivate(
    @CurrentUser() user: { id?: number | string },
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = user?.id as number | string;
    if (!userId) throw new UnauthorizedException('Invalid user');
    return this.service.deactivateForUser(String(userId), id);
  }

  @Post(':id/revoke')
  @ApiOperation({
    summary: 'Revoke a consumer API key owned by the logged-in user',
  })
  async revoke(
    @CurrentUser() user: { id?: number | string },
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = user?.id as number | string;
    if (!userId) throw new UnauthorizedException('Invalid user');
    return this.service.revokeForUser(String(userId), id);
  }

  @Patch(':id/expiry')
  @ApiOperation({
    summary:
      'Update expiry date for a consumer API key owned by the logged-in user',
  })
  async updateExpiry(
    @CurrentUser() user: { id?: number | string },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateConsumerApiKeyDto,
  ) {
    const userId = user?.id as number | string;
    if (!userId) throw new UnauthorizedException('Invalid user');
    return this.service.updateExpiryForUser(String(userId), id, dto);
  }
}
