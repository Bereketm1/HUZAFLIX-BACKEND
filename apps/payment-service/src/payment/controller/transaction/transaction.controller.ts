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
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
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
