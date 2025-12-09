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

    const filename = api.openapi_spec_url.split('/').pop();

    if (!filename) {
      throw new BadRequestException(`Invalid filename`);
    }

    const url = await this.apiService.getDocs(filename);

    const response = await fetch(url);

    if (!response.ok) {
      throw new BadRequestException(
        `Failed to load Swagger docs: ${JSON.stringify(await response.json())}`,
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

    const filename = api.openapi_spec_url.split('/').pop();

    if (!filename) {
      throw new BadRequestException(`Invalid filename`);
    }

    const url = await this.apiService.getDocs(filename);

    const response = await fetch(url);

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

  async getEndpointDetails(apiId: number, operationId: string) {
    const api = await this.apiService.findOneById(apiId);
    if (!api) throw new BadRequestException('API not found');

    const filename = api.openapi_spec_url.split('/').pop();
    if (!filename) throw new BadRequestException(`Invalid filename`);

    const url = await this.apiService.getDocs(filename);
    const response = await fetch(url);

    if (!response.ok) {
      throw new BadRequestException(
        `Failed to load Swagger docs: ${response.statusText}`,
      );
    }

    const swagger = (await response.json()) as OpenAPIV3.Document;
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

            // Core metadata
            summary: operation.summary,
            description: operation.description,
            tags: operation.tags || [],
            deprecated: operation.deprecated || false,
            security: operation.security || [],

            // Parameters (query, path, header, cookie)
            parameters:
              (operation.parameters as OpenAPIV3.ParameterObject[]) || [],

            // Request body
            requestBody: operation.requestBody
              ? this.extractRequestBody(operation.requestBody)
              : null,

            // Responses with schemas
            responses: this.extractResponses(operation.responses),
          };
        }
      }
    }

    throw new BadRequestException(
      `Operation ID "${operationId}" not found in OpenAPI spec`,
    );
  }

  private extractRequestBody(
    requestBody: OpenAPIV3.RequestBodyObject | OpenAPIV3.ReferenceObject,
  ) {
    if ('$ref' in requestBody) return { $ref: requestBody.$ref };

    return {
      description: requestBody.description,
      required: requestBody.required,
      content: requestBody.content, // includes schema, examples, media types
    };
  }

  private extractResponses(responses: OpenAPIV3.ResponsesObject) {
    const output = {};

    for (const status in responses) {
      const res = responses[status];

      if ('$ref' in res) {
        output[status] = { $ref: res.$ref };
        continue;
      }

      output[status] = {
        description: res.description,
        headers: res.headers,
        content: res.content, // full schema + examples
      };
    }

    return output;
  }
}
