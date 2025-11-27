import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UnauthorizedException,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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

  @Get()
  @ApiOperation({ summary: "List current user's API keys" })
  @ApiResponse({ status: 200, description: 'List of keys' })
  async findAll(@CurrentUser() user: { id?: number | string }) {
    const userId = user?.id as number | string;
    if (!userId) throw new UnauthorizedException('Invalid user');
    return this.service.findAllForUser(String(userId));
  }

  @Post()
  @ApiOperation({ summary: "Create a new API key for the logged-in user" })
  @ApiResponse({ status: 201, description: 'Created key (one-time returned value)' })
  async create(@CurrentUser() user: { id?: number | string }, @Body() dto: CreateConsumerApiKeyDto) {
    const userId = user?.id as number | string;
    if (!userId) throw new UnauthorizedException('Invalid user');
    return this.service.createForUser(String(userId), dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: "Update an existing API key owned by the logged-in user" })
  async update(
    @CurrentUser() user: { id?: number | string },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateConsumerApiKeyDto,
  ) {
    const userId = user?.id as number | string;
    if (!userId) throw new UnauthorizedException('Invalid user');
    return this.service.updateForUser(String(userId), id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: "Revoke (soft-delete) an API key owned by the logged-in user" })
  async remove(@CurrentUser() user: { id?: number | string }, @Param('id', ParseIntPipe) id: number) {
    const userId = user?.id as number | string;
    if (!userId) throw new UnauthorizedException('Invalid user');
    return this.service.revokeForUser(String(userId), id);
  }
}
