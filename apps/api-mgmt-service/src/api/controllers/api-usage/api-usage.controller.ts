import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ApiUsageService, ValidationResult } from '../../services/api-usage/api-usage.service';

@Controller()
export class ApiUsageController {
  constructor(private readonly apiUsageService: ApiUsageService) {}

  @MessagePattern('validate_request')
  async validateRequest(
    @Payload() data: { apiKey: string; path: string },
  ): Promise<ValidationResult> {
    return await this.apiUsageService.validateRequest(data.apiKey, data.path);
  }
}
