import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';
import { ApiStatus } from 'src/api/entities/api.entity';

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
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  base_path: string;

  @ApiProperty({ description: 'API version', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  version: string;

  @ApiProperty({
    description: 'API status',
    enum: ApiStatus,
    default: ApiStatus.DRAFT,
  })
  @IsEnum(ApiStatus)
  @IsOptional()
  status?: ApiStatus;

  @ApiProperty({ description: 'OpenAPI spec key', maxLength: 512 })
  @IsString()
  @IsNotEmpty()
  @Length(1, 512)
  openapi_spec_key: string;

  @ApiProperty({ description: 'OpenAPI spec URL', maxLength: 1024 })
  @IsUrl()
  @IsNotEmpty()
  @Length(1, 1024)
  openapi_spec_url: string;

  @ApiProperty({ description: 'ID of the user who created this API' })
  @IsNumber()
  @IsNotEmpty()
  created_by: string;
}
