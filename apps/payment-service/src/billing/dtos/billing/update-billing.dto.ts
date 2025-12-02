import { PartialType } from '@nestjs/swagger';
import { CreateBillingInfoDto } from './create-billing.dto';

export class UpdateBillingInfoDto extends PartialType(CreateBillingInfoDto) {}
