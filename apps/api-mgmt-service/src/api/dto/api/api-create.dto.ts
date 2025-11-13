import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';

export class CreateApiDto {
  @ApiProperty({ description: 'Name of the API', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @ApiProperty({ description: 'Unique slug for the API', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  slug: string;

  @ApiPropertyOptional({ description: 'Description of the API' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Base path of the API', maxLength: 255 })
  @IsUrl()
  @IsNotEmpty()
  @Length(1, 255)
  base_path: string;

  @ApiProperty({ description: 'API version', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  version: string;
}
