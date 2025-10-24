import { IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'New password', minLength: 8 })
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}
