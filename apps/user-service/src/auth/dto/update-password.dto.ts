import { IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePasswordDto {
  @ApiProperty({ description: 'New password', minLength: 8 })
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;

  @ApiProperty({ description: 'Current password', minLength: 8 })
  @IsNotEmpty()
  @MinLength(8)
  currentPassword: string;
}
