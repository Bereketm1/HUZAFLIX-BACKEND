import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUrl, Length } from 'class-validator';
import { ApiStatus } from 'src/api/entities/api.entity';

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

  @ApiPropertyOptional({ description: 'Description of the API' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Base path of the API', maxLength: 255 })
  @IsString()
  @IsOptional()
  @Length(1, 255)
  base_path?: string;

  @ApiPropertyOptional({ description: 'API version', maxLength: 50 })
  @IsString()
  @IsOptional()
  @Length(1, 50)
  version?: string;

  @ApiPropertyOptional({ description: 'API status', enum: ApiStatus })
  @IsEnum(ApiStatus)
  @IsOptional()
  status?: ApiStatus;

  @ApiPropertyOptional({ description: 'OpenAPI spec key', maxLength: 512 })
  @IsString()
  @IsOptional()
  @Length(1, 512)
  openapi_spec_key?: string;

  @ApiPropertyOptional({ description: 'OpenAPI spec URL', maxLength: 1024 })
  @IsUrl()
  @IsOptional()
  @Length(1, 1024)
  openapi_spec_url?: string;

  @ApiPropertyOptional({ description: 'ID of the user who created this API' })
  @IsString()
  @IsOptional()
  created_by?: string;
}
