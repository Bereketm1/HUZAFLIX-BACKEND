import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
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

  private async resolveOpenApiUrl(api: { openapi_spec_url?: string | null }) {
    if (!api.openapi_spec_url) {
      throw new BadRequestException('OpenAPI spec URL not set for this API');
    }

    const filename = api.openapi_spec_url.split('/').pop();
    if (!filename) {
      throw new BadRequestException('Invalid filename');
    }

    try {
      const resolved = await this.apiService.getDocs(filename);
      return resolved || api.openapi_spec_url;
    } catch {
      return api.openapi_spec_url;
    }
  }

  async getEndpointsFromSwagger(apiId: number): Promise<SwaggerEndpoint[]> {
    const api = await this.apiService.findOneById(apiId);
    if (!api) {
      throw new BadRequestException(`API not found`);
    }

    const url = await this.resolveOpenApiUrl(api);

    let response: Response;
    try {
      response = await fetch(url);
    } catch (error) {
      throw new BadGatewayException(
        `Failed to fetch Swagger docs: ${(error as Error).message}`,
      );
    }

    if (!response.ok) {
      const bodyText = await response.text();
      throw new BadRequestException(
        `Failed to load Swagger docs: ${response.status} ${response.statusText} ${bodyText}`,
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

    const url = await this.resolveOpenApiUrl(api);

    let response: Response;
    try {
      response = await fetch(url);
    } catch (error) {
      throw new BadGatewayException(
        `Failed to fetch Swagger docs: ${(error as Error).message}`,
      );
    }

    if (!response.ok) {
      const bodyText = await response.text();
      throw new BadRequestException(
        `Failed to load Swagger docs: ${response.status} ${response.statusText} ${bodyText}`,
      );
    }

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

    const url = await this.resolveOpenApiUrl(api);

    let response: Response;
    try {
      response = await fetch(url);
    } catch (error) {
      throw new BadGatewayException(
        `Failed to fetch Swagger docs: ${(error as Error).message}`,
      );
    }

    if (!response.ok) {
      const bodyText = await response.text();
      throw new BadRequestException(
        `Failed to load Swagger docs: ${response.status} ${response.statusText} ${bodyText}`,
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
