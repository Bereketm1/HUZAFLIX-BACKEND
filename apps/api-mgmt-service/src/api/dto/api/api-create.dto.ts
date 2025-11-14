import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
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

  @ApiProperty({ description: 'Average response time of the api' })
  @IsNumber()
  @IsNotEmpty()
  avg_response_time: number;

  @ApiProperty({ description: 'Category of the API', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  category: string;

  @ApiPropertyOptional({ description: 'Tags of the API' })
  @IsArray()
  @IsOptional()
  tags: string[];

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

  @ApiProperty({ description: 'Base path of the API', maxLength: 255 })
  @IsUrl()
  @IsNotEmpty()
  @Length(1, 255)
  base_path: string;

  @ApiProperty({ description: 'Base API key of the API' })
  @IsString()
  @IsNotEmpty()
  base_api_key: string;

  @ApiProperty({ description: 'API version', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  version: string;
}
