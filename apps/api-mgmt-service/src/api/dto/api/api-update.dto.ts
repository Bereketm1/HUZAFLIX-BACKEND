import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, Length } from 'class-validator';

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
  @IsUrl()
  @IsOptional()
  @Length(1, 255)
  base_path?: string;

  @ApiPropertyOptional({ description: 'API version', maxLength: 50 })
  @IsString()
  @IsOptional()
  @Length(1, 50)
  version?: string;
}
