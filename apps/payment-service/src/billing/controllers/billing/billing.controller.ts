import {
  Body,
  Controller,
  Get,
  Param,
  Delete,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@huzaflix/common';
import { BillingService } from 'src/billing/services/billing/billing.service';
import { CreateBillingInfoDto } from 'src/billing/dtos/billing/create-billing.dto';
import { UpdateBillingInfoDto } from 'src/billing/dtos/billing/update-billing.dto';

@ApiTags('billing')
@Controller('billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('api_consumer')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  @ApiOperation({ summary: 'Get all billing profiles' })
  @ApiResponse({
    status: 200,
    description: 'Fetched all billing profiles successfully',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async findAll(
    @CurrentUser() user: { id: number },
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return await this.billingService.findAll({ userId: user.id, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get billing profile by ID' })
  @ApiResponse({
    status: 200,
    description: 'Fetched billing profile successfully',
  })
  @Roles('api_consumer', 'administrator')
  async findOne(@Param('id') id: number, @CurrentUser() user: { id: number }) {
    return await this.billingService.findOneById(id, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new billing profile' })
  @ApiResponse({
    status: 201,
    description: 'Created billing profile successfully',
  })
  async create(
    @Body() createBillingDto: CreateBillingInfoDto,
    @CurrentUser() user: { id: number },
  ) {
    return await this.billingService.create(createBillingDto, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update billing profile by ID' })
  @ApiResponse({
    status: 200,
    description: 'Updated billing profile successfully',
  })
  @Roles('api_consumer', 'administrator')
  async update(
    @CurrentUser() user: { id: number },
    @Param('id') id: number,
    @Body() updateBillingDto: UpdateBillingInfoDto,
  ) {
    return await this.billingService.update(id, user.id, updateBillingDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete billing profile by ID' })
  @ApiResponse({
    status: 200,
    description: 'Deleted billing profile successfully',
  })
  @Roles('api_consumer', 'administrator')
  async remove(@Param('id') id: number, @CurrentUser() user: { id: number }) {
    await this.billingService.remove(id, user.id);
    return { message: `Billing profile ${id} deleted successfully` };
  }

  @Delete(':id/force')
  @ApiOperation({ summary: 'Delete billing profile by ID' })
  @ApiResponse({
    status: 200,
    description: 'Deleted billing profile successfully',
  })
  @Roles('api_consumer', 'administrator')
  async removeForce(
    @Param('id') id: number,
    @CurrentUser() user: { id: number },
  ) {
    await this.billingService.forceRemove(id, user.id);
    return { message: `Billing profile ${id} deleted successfully` };
  }
}
