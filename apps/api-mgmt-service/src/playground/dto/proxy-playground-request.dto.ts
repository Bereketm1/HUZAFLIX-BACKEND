import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class ProxyPlaygroundRequestDto {
  @ApiProperty({
    description: 'HTTP method to call on the upstream API',
    example: 'GET',
  })
  @IsString()
  @IsIn(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'])
  method: string;

  @ApiProperty({
    description: 'Endpoint path to call relative to the API base path',
    example: '/v1/users',
  })
  @IsString()
  path: string;

  @ApiPropertyOptional({
    description: 'Consumer API key for authorization in playground proxy',
    example: 'AB12CD34_xxxxxxxxxxxxxxxxxxxxxxxx',
  })
  @IsOptional()
  @IsString()
  consumer_api_key?: string;

  @ApiPropertyOptional({
    description:
      'API test key from API definition for playground proxy authorization',
    example: 'test_sk_xxxxxxxxxxxxxxxxxxxxxxxx',
  })
  @IsOptional()
  @IsString()
  api_test_key?: string;

  @ApiPropertyOptional({
    description: 'Additional query string parameters',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  query?: Record<string, string | number | boolean>;

  @ApiPropertyOptional({
    description: 'Additional request headers',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Request body for methods that support body',
    type: Object,
  })
  @IsOptional()
  body?: unknown;
}
