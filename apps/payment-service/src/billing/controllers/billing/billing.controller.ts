import {
  Body,
  Controller,
  Get,
  Param,
  Delete,
  Post,
  Put,
  UseGuards,
  Patch,
  UnprocessableEntityException,
  Headers,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@huzaflix/common';
import { BillingService } from 'src/billing/services/billing/billing.service';
import { CreateBillingInfoDto } from 'src/billing/dtos/billing/create-billing.dto';
import { UpdateBillingInfoDto } from 'src/billing/dtos/billing/update-billing.dto';
import { AttachPaymentMethodDto } from 'src/billing/dtos/billing/attach-payment-method.dto';
import { IssuePaymentDto } from 'src/billing/dtos/billing/issue-payment.dto';
import { stripe } from 'src/stripe/helper';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('api_consumer')
  @ApiOperation({ summary: 'Get all billing profiles for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Fetched billing profiles successfully',
  })
  async findAll(@CurrentUser() user: { id: number }) {
    return await this.billingService.findAllByUserId(user.id);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('api_consumer')
  @ApiOperation({ summary: 'Get billing profile by ID' })
  @ApiResponse({
    status: 200,
    description: 'Fetched billing profile successfully',
  })
  async findOne(@Param('id') id: number, @CurrentUser() user: { id: number }) {
    return await this.billingService.findOneById(id, user.id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('api_consumer')
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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('api_consumer')
  @ApiOperation({ summary: 'Update billing profile by ID' })
  @ApiResponse({
    status: 200,
    description: 'Updated billing profile successfully',
  })
  async update(
    @CurrentUser() user: { id: number },
    @Param('id') id: number,
    @Body() updateBillingDto: UpdateBillingInfoDto,
  ) {
    return await this.billingService.update(id, user.id, updateBillingDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('api_consumer')
  @ApiOperation({ summary: 'Delete billing profile by ID' })
  @ApiResponse({
    status: 200,
    description: 'Deleted billing profile successfully',
  })
  async remove(@Param('id') id: number, @CurrentUser() user: { id: number }) {
    await this.billingService.remove(id, user.id);
    return { message: `Billing profile ${id} deleted successfully` };
  }

  @Delete(':id/force')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('api_consumer')
  @ApiOperation({ summary: 'Delete billing profile by ID' })
  @ApiResponse({
    status: 200,
    description: 'Deleted billing profile successfully',
  })
  async removeForce(
    @Param('id') id: number,
    @CurrentUser() user: { id: number },
  ) {
    await this.billingService.forceRemove(id, user.id);
    return { message: `Billing profile ${id} deleted successfully` };
  }

  @Patch('payment-methods/attach')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('api_consumer')
  @ApiOperation({ summary: 'Attach a payment method to a billing profile' })
  @ApiResponse({
    status: 200,
    description: 'Payment method attached successfully',
  })
  async attachPaymentMethod(
    @CurrentUser() user: { id: number },
    @Body() bodyDto: AttachPaymentMethodDto,
  ) {
    return await this.billingService.attachPaymentMethod(
      bodyDto.billingProfileId,
      bodyDto.paymentMethodId,
      user.id,
      bodyDto.setAsDefault,
    );
  }

  @Post('charge')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('api_consumer')
  async charge(
    @CurrentUser() user: { id: number },
    @Body() body: IssuePaymentDto,
  ) {
    return this.billingService.issuePayment(user.id, body);
  }

  @Post('webhook')
  async webhook(
    @Req() req: Request & { body: Buffer },
    @Headers('stripe-signature') signature: string,
  ) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new UnprocessableEntityException('No secret setup');

    const event = stripe.webhooks.constructEvent(req.body, signature, secret);
    await this.billingService.handleStripeWebhook(event);
    return { received: true };
  }
}
