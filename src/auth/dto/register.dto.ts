import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'strongPassword123' })
  password: string;

  @ApiProperty({
    required: false,
    description: 'Optional metadata',
    type: Object,
    additionalProperties: true,
  })
  metadata?: Record<string, unknown>;
}
