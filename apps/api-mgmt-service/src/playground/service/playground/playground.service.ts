import { BadRequestException, Injectable } from '@nestjs/common';
import { OpenAPIV3 } from 'openapi-types';
import { ApiService } from 'src/api/services/api/api.service';

export interface SwaggerEndpoint {
  path: string;
  method: string;
  operationId: string | null;
  summary: string | null;
  description: string | null;
}

type HttpMethod =
  | 'get'
  | 'post'
  | 'put'
  | 'patch'
  | 'delete'
  | 'options'
  | 'head'
  | 'trace';

const validMethods: HttpMethod[] = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'head',
  'trace',
];

@Injectable()
export class PlaygroundService {
  constructor(private readonly apiService: ApiService) {}

  async getEndpointsFromSwagger(apiId: number): Promise<SwaggerEndpoint[]> {
    const api = await this.apiService.findOneById(apiId);
    if (!api) {
      throw new BadRequestException(`API not found`);
    }

    console.log(api.openapi_spec_url);

    const response = await fetch(api.openapi_spec_url);

    if (!response.ok) {
      throw new BadRequestException(
        `Failed to load Swagger docs: ${response.statusText}`,
      );
    }

    const swagger = (await response.json()) as unknown as OpenAPIV3.Document;

    const paths: OpenAPIV3.PathsObject = swagger.paths || {};
    const result: SwaggerEndpoint[] = [];

    for (const path of Object.keys(paths)) {
      const pathObj = paths[path];
      if (!pathObj) continue;

      for (const method of validMethods) {
        const operation = pathObj[method];
        if (!operation) continue;

        result.push({
          path,
          method: method.toUpperCase(),
          operationId: operation.operationId || null,
          summary: operation.summary || null,
          description: operation.description || null,
        });
      }
    }

    return result;
  }

  async getEndpointResponses(apiId: number, operationId: string) {
    const api = await this.apiService.findOneById(apiId);
    if (!api) throw new BadRequestException('API not found');

    console.log(api.openapi_spec_url);

    const response = await fetch(api.openapi_spec_url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'NestJS-Fetch',
      },
    });

    if (!response.ok)
      throw new BadRequestException(
        `Failed to load Swagger docs: ${response.statusText}`,
      );

    const swagger = (await response.json()) as unknown as OpenAPIV3.Document;

    const paths = swagger.paths;

    for (const path in paths) {
      const pathObj = paths[path];
      if (!pathObj) continue;

      for (const method of validMethods) {
        const operation = pathObj[method];
        if (!operation) continue;

        if (operation.operationId === operationId) {
          return {
            path,
            method: method.toUpperCase(),
            responses: operation.responses,
          };
        }
      }
    }

    throw new BadRequestException(
      `Operation ID "${operationId}" not found in OpenAPI spec`,
    );
  }
}
