import {
  CurrentUser,
  JwtAuthGuard,
  JwtAuthGuardWithPublic,
  Roles,
  RolesGuard,
} from '@huzaflix/common';
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
import { CreatePaymentRequestDto } from 'src/payment-request/dto/payment-request/create-payment-request.dto';
import { PaymentRequestService } from 'src/payment-request/services/payment-request/payment-request.service';

@Controller('payment-request')
export class PaymentRequestController {
  constructor(private readonly paymentRequestService: PaymentRequestService) {}

  @Get()
  @ApiOperation({ summary: 'Get all apis' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuardWithPublic)
  @ApiResponse({
    status: 200,
    description: 'Fetched all payment requests successfully',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?: { id: number; role: { name: string } },
  ) {
    return await this.paymentRequestService.findAll(
      {
        page,
        limit,
      },
      user?.role?.name,
      user?.id,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get by ID' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuardWithPublic)
  @ApiResponse({ status: 200, description: 'Fetched successfully' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user?: { role: { name: string } },
  ) {
    return await this.paymentRequestService.findOneById(
      Number(id),
      user?.role?.name,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('api_consumer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create' })
  @ApiResponse({ status: 201, description: 'Created successfully' })
  async create(
    @Body() createApiDto: CreatePaymentRequestDto,
    @CurrentUser() user: { id: string },
  ) {
    return await this.paymentRequestService.create({
      ...createApiDto,
      userId: Number(user.id),
    });
  }
}
