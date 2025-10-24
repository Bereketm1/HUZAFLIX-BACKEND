import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsOptional,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  @ApiProperty({ example: 'strongPassword123' })
  password?: string;

  @IsNotEmpty()
  @ApiProperty({ required: true, example: 1 })
  role_id: number;

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
