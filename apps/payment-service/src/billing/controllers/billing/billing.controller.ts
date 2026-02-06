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
import { SetDefaultPaymentMethodDto } from 'src/billing/dtos/billing/set-default-payment-method.dto';
import { IssuePaymentDto } from 'src/billing/dtos/billing/issue-payment.dto';
import { stripe } from 'src/stripe/helper';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // ── Profile (one per user) ────────────────────

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('api_consumer')
  @ApiOperation({ summary: 'Get billing profile for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Fetched billing profile successfully',
  })
  async findMine(@CurrentUser() user: { id: number }) {
    return await this.billingService.findByUserId(user.id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('api_consumer')
  @ApiOperation({ summary: 'Create a billing profile (one per user)' })
  @ApiResponse({
    status: 201,
    description: 'Created billing profile successfully',
  })
  @ApiResponse({ status: 409, description: 'Profile already exists' })
  async create(
    @Body() createBillingDto: CreateBillingInfoDto,
    @CurrentUser() user: { id: number },
  ) {
    return await this.billingService.create(createBillingDto, user.id);
  }

  @Put()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('api_consumer')
  @ApiOperation({ summary: 'Update billing profile' })
  @ApiResponse({
    status: 200,
    description: 'Updated billing profile successfully',
  })
  async update(
    @CurrentUser() user: { id: number },
    @Body() updateBillingDto: UpdateBillingInfoDto,
  ) {
    return await this.billingService.update(user.id, updateBillingDto);
  }

  @Delete()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('api_consumer')
  @ApiOperation({ summary: 'Delete billing profile (credits must be 0)' })
  @ApiResponse({
    status: 200,
    description: 'Deleted billing profile successfully',
  })
  async remove(@CurrentUser() user: { id: number }) {
    await this.billingService.remove(user.id);
    return { message: 'Billing profile deleted successfully' };
  }

  @Delete('force')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('api_consumer')
  @ApiOperation({ summary: 'Force-delete billing profile' })
  @ApiResponse({
    status: 200,
    description: 'Deleted billing profile successfully',
  })
  async removeForce(@CurrentUser() user: { id: number }) {
    await this.billingService.forceRemove(user.id);
    return { message: 'Billing profile deleted successfully' };
  }

  // ── Payment Methods ───────────────────────────

  @Get('payment-methods')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('api_consumer')
  @ApiOperation({ summary: 'List all payment methods for this user' })
  @ApiResponse({
    status: 200,
    description: 'Payment methods retrieved successfully',
  })
  async listPaymentMethods(@CurrentUser() user: { id: number }) {
    return await this.billingService.listPaymentMethods(user.id);
  }

  @Patch('payment-methods/attach')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('api_consumer')
  @ApiOperation({ summary: 'Attach a payment method' })
  @ApiResponse({
    status: 200,
    description: 'Payment method attached successfully',
  })
  async attachPaymentMethod(
    @CurrentUser() user: { id: number },
    @Body() bodyDto: AttachPaymentMethodDto,
  ) {
    return await this.billingService.attachPaymentMethod(
      bodyDto.paymentMethodId,
      user.id,
      bodyDto.setAsDefault,
    );
  }

  @Delete('payment-methods/:paymentMethodId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('api_consumer')
  @ApiOperation({ summary: 'Detach a payment method' })
  @ApiResponse({
    status: 200,
    description: 'Payment method detached successfully',
  })
  async detachPaymentMethod(
    @Param('paymentMethodId') paymentMethodId: string,
    @CurrentUser() user: { id: number },
  ) {
    return await this.billingService.detachPaymentMethod(
      paymentMethodId,
      user.id,
    );
  }

  @Patch('payment-methods/default')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('api_consumer')
  @ApiOperation({ summary: 'Set the default payment method' })
  @ApiResponse({
    status: 200,
    description: 'Default payment method updated',
  })
  async setDefaultPaymentMethod(
    @CurrentUser() user: { id: number },
    @Body() bodyDto: SetDefaultPaymentMethodDto,
  ) {
    return await this.billingService.setDefaultPaymentMethod(
      bodyDto.paymentMethodId,
      user.id,
    );
  }

  // ── Charge ────────────────────────────────────

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

  // ── Webhook ───────────────────────────────────

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
