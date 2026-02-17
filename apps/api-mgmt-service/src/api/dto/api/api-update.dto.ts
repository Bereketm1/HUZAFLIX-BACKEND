import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';
import { ApiType } from 'src/api/entities/api.entity';

export class UpdateApiDto {
  @ApiPropertyOptional({ description: 'Name of the API', maxLength: 255 })
  @IsString()
  @IsOptional()
  @Length(1, 255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Unique slug for the API',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @Length(1, 255)
  slug?: string;

  @ApiPropertyOptional({ description: 'Average response time of the api' })
  @IsOptional()
  @IsNumber()
  avg_response_time?: number;

  @ApiPropertyOptional({ description: 'Category of the API', maxLength: 255 })
  @IsString()
  @IsOptional()
  @Length(1, 255)
  category?: string;

  @ApiPropertyOptional({ description: 'Type of the API' })
  @IsString()
  @IsEnum(ApiType)
  @IsOptional()
  @Length(1, 255)
  type?: string;

  @ApiPropertyOptional({ description: 'Tags of the API' })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Name of the company hosting the API',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @Length(1, 255)
  company_name?: string;

  @ApiPropertyOptional({ description: 'Company contact email', maxLength: 255 })
  @IsString()
  @IsOptional()
  @Length(1, 255)
  company_contact_email?: string;

  @ApiPropertyOptional({
    description: 'Company contact phone number',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @Length(1, 255)
  company_contact_phone?: string;

  @ApiPropertyOptional({ description: 'Description of the API' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Base path of the API', maxLength: 255 })
  @IsUrl()
  @IsOptional()
  @Length(1, 255)
  base_path?: string;

  @ApiPropertyOptional({
    description: 'Base API key of the API',
  })
  @IsString()
  @IsOptional()
  base_api_key?: string;

  @ApiPropertyOptional({
    description: 'Test API key of the API',
  })
  @IsString()
  @IsOptional()
  test_api_key?: string;

  @ApiPropertyOptional({ description: 'API version', maxLength: 50 })
  @IsString()
  @IsOptional()
  @Length(1, 50)
  version?: string;
}
