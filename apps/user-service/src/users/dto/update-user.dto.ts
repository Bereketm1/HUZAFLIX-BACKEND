import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsObject, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  @ApiProperty({ example: 'user@example.com' })
  email?: string;

  @IsOptional()
  @ApiProperty({ example: 1 })
  role_id?: number;

  @ApiProperty({
    required: false,
    description: 'Optional metadata',
    type: Object,
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
