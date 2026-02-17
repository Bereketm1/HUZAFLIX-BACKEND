import { CurrentUser, JwtAuthGuard } from '@huzaflix/common';
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { TransactionsService } from 'src/payment/services/transactions/transactions.service';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all transactions' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Fetched all transactions successfully',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    example: '2026-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    example: '2026-01-31',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'created_at',
  })
  @ApiQuery({ name: 'order', required: false, type: String, example: 'desc' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: 'asc' | 'desc',
    @CurrentUser() user?: { id: number; role?: { name?: string } | string },
  ) {
    const roleName =
      typeof user?.role === 'string' ? user.role : user?.role?.name;
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    return await this.transactionsService.findAll(
      {
        page: Number.isFinite(pageNumber) ? pageNumber : undefined,
        limit: Number.isFinite(limitNumber) ? limitNumber : undefined,
        startDate: startDate,
        endDate: endDate,
        sortBy: sortBy,
        order: order,
      },
      roleName,
      user?.id,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get by ID' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Fetched successfully' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user?: { role?: { name?: string } | string },
  ) {
    const roleName =
      typeof user?.role === 'string' ? user.role : user?.role?.name;
    return await this.transactionsService.findOneById(Number(id), roleName);
  }
}
