import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class UpdateRoleDto {
  @IsOptional()
  @ApiProperty({
    example: 'admin',
  })
  name: string;

  @IsOptional()
  @ApiProperty({
    description: 'The description of the role',
    example: 'Administrator role',
  })
  description: string;
}
