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

  private isArraySchemaObject(
    schema: OpenAPIV3.SchemaObject,
  ): schema is OpenAPIV3.ArraySchemaObject {
    return schema.type === 'array' && 'items' in schema;
  }

  private getOperation(
    swagger: OpenAPIV3.Document,
    operationId: string,
  ): {
    path: string;
    method: string;
    operation: OpenAPIV3.OperationObject;
  } | null {
    const paths = swagger.paths || {};
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
            operation,
          };
        }
      }
    }

    return null;
  }

  private resolveRef(
    swagger: OpenAPIV3.Document,
    ref: string,
  ): Record<string, unknown> {
    if (!ref.startsWith('#/')) {
      throw new BadRequestException(`Unsupported external $ref: ${ref}`);
    }

    const segments = ref
      .replace(/^#\//, '')
      .split('/')
      .map((s) => s.replace(/~1/g, '/').replace(/~0/g, '~'));

    let current: unknown = swagger as unknown;
    for (const segment of segments) {
      if (!current || typeof current !== 'object') {
        throw new BadRequestException(`Invalid $ref: ${ref}`);
      }

      const next = (current as Record<string, unknown>)[segment];
      if (next === undefined) {
        throw new BadRequestException(`Unresolvable $ref: ${ref}`);
      }
      current = next;
    }

    if (!current || typeof current !== 'object') {
      throw new BadRequestException(`Unresolvable $ref: ${ref}`);
    }

    return current as Record<string, unknown>;
  }

  private resolveResponseObjectRef(
    swagger: OpenAPIV3.Document,
    ref: string,
  ): OpenAPIV3.ResponseObject {
    const resolved = this.resolveRef(swagger, ref);
    if (typeof resolved.description !== 'string') {
      throw new BadRequestException(`Invalid response $ref: ${ref}`);
    }

    return resolved as unknown as OpenAPIV3.ResponseObject;
  }

  private resolveRequestBodyObjectRef(
    swagger: OpenAPIV3.Document,
    ref: string,
  ): OpenAPIV3.RequestBodyObject {
    const resolved = this.resolveRef(swagger, ref);
    if (!resolved.content || typeof resolved.content !== 'object') {
      throw new BadRequestException(`Invalid requestBody $ref: ${ref}`);
    }

    return resolved as unknown as OpenAPIV3.RequestBodyObject;
  }

  private dereferenceSchema(
    swagger: OpenAPIV3.Document,
    schema?: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
    visited = new Set<string>(),
  ): OpenAPIV3.SchemaObject | null {
    if (!schema) return null;

    if ('$ref' in schema) {
      const ref = schema.$ref;
      if (visited.has(ref)) {
        throw new BadRequestException(`Circular $ref detected: ${ref}`);
      }

      visited.add(ref);
      const resolved = this.resolveRef(swagger, ref) as
        | OpenAPIV3.SchemaObject
        | OpenAPIV3.ReferenceObject;
      return this.dereferenceSchema(swagger, resolved, visited);
    }

    const deref: OpenAPIV3.SchemaObject = { ...schema };

    if (schema.properties) {
      const properties: Record<string, OpenAPIV3.SchemaObject> = {};
      for (const [key, value] of Object.entries(schema.properties)) {
        const resolvedProp = this.dereferenceSchema(
          swagger,
          value,
          new Set(visited),
        );
        if (resolvedProp) {
          properties[key] = resolvedProp;
        }
      }
      deref.properties = properties;
    }

    if (this.isArraySchemaObject(schema) && this.isArraySchemaObject(deref)) {
      const items = this.dereferenceSchema(
        swagger,
        schema.items,
        new Set(visited),
      );
      if (items) {
        deref.items = items;
      }
    }

    if (schema.allOf) {
      deref.allOf = schema.allOf
        .map((item) => this.dereferenceSchema(swagger, item, new Set(visited)))
        .filter((item): item is OpenAPIV3.SchemaObject => Boolean(item));
    }

    if (schema.oneOf) {
      deref.oneOf = schema.oneOf
        .map((item) => this.dereferenceSchema(swagger, item, new Set(visited)))
        .filter((item): item is OpenAPIV3.SchemaObject => Boolean(item));
    }

    if (schema.anyOf) {
      deref.anyOf = schema.anyOf
        .map((item) => this.dereferenceSchema(swagger, item, new Set(visited)))
        .filter((item): item is OpenAPIV3.SchemaObject => Boolean(item));
    }

    return deref;
  }

  private buildExampleFromSchema(schema: OpenAPIV3.SchemaObject): unknown {
    if (schema.example !== undefined) return schema.example;
    if (schema.default !== undefined) return schema.default;
    if (schema.enum && schema.enum.length > 0) return schema.enum[0];
    if (schema.allOf && schema.allOf.length > 0) {
      return schema.allOf.reduce(
        (acc, part) => {
          if ('$ref' in part) return acc;
          const value = this.buildExampleFromSchema(part);
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            return { ...acc, ...value };
          }
          return acc;
        },
        {} as Record<string, unknown>,
      );
    }
    if (schema.oneOf && schema.oneOf.length > 0) {
      const first = schema.oneOf[0];
      if ('$ref' in first) return 'string';
      return this.buildExampleFromSchema(first);
    }
    if (schema.anyOf && schema.anyOf.length > 0) {
      const first = schema.anyOf[0];
      if ('$ref' in first) return 'string';
      return this.buildExampleFromSchema(first);
    }

    const type = schema.type;
    if (type === 'object' || (!type && schema.properties)) {
      const obj: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(schema.properties || {})) {
        obj[key] = this.buildExampleFromSchema(value as OpenAPIV3.SchemaObject);
      }
      return obj;
    }

    if (type === 'array') {
      if (!schema.items) return [];
      return [
        this.buildExampleFromSchema(schema.items as OpenAPIV3.SchemaObject),
      ];
    }

    if (type === 'integer' || type === 'number') return 0;
    if (type === 'boolean') return false;
    return 'string';
  }

  private extractMediaTypeExample(
    swagger: OpenAPIV3.Document,
    mediaType: OpenAPIV3.MediaTypeObject,
  ): { schema: OpenAPIV3.SchemaObject | null; example?: unknown } {
    const schema = this.dereferenceSchema(swagger, mediaType.schema);

    if (mediaType.example !== undefined) {
      return { schema, example: mediaType.example };
    }

    if (mediaType.examples) {
      const firstExample = Object.values(mediaType.examples)[0];
      if (firstExample) {
        if ('$ref' in firstExample) {
          const resolved = this.resolveRef(swagger, firstExample.$ref) as {
            value?: unknown;
          };
          return { schema, example: resolved.value };
        }
        return { schema, example: firstExample.value };
      }
    }

    if (schema) {
      return { schema, example: this.buildExampleFromSchema(schema) };
    }

    return { schema };
  }

  private extractResponsesWithExamples(
    swagger: OpenAPIV3.Document,
    responses: OpenAPIV3.ResponsesObject,
  ) {
    const output: Record<string, unknown> = {};
    for (const [status, responseOrRef] of Object.entries(responses)) {
      let responseObj: OpenAPIV3.ResponseObject;

      if ('$ref' in responseOrRef) {
        responseObj = this.resolveResponseObjectRef(
          swagger,
          responseOrRef.$ref,
        );
      } else {
        responseObj = responseOrRef;
      }

      const content: Record<string, unknown> = {};
      for (const [mediaType, mediaTypeObj] of Object.entries(
        responseObj.content || {},
      )) {
        content[mediaType] = this.extractMediaTypeExample(
          swagger,
          mediaTypeObj,
        );
      }

      output[status] = {
        description: responseObj.description,
        headers: responseObj.headers,
        content,
      };
    }

    return output;
  }

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

    const swagger = (await response.json()) as OpenAPIV3.Document;
    const found = this.getOperation(swagger, operationId);
    if (!found) {
      throw new BadRequestException(
        `Operation ID "${operationId}" not found in OpenAPI spec`,
      );
    }

    return {
      path: found.path,
      method: found.method,
      responses: this.extractResponsesWithExamples(
        swagger,
        found.operation.responses || {},
      ),
    };
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
    const found = this.getOperation(swagger, operationId);
    if (!found) {
      throw new BadRequestException(
        `Operation ID "${operationId}" not found in OpenAPI spec`,
      );
    }

    return {
      path: found.path,
      method: found.method,
      summary: found.operation.summary,
      description: found.operation.description,
      tags: found.operation.tags || [],
      deprecated: found.operation.deprecated || false,
      security: found.operation.security || [],
      parameters:
        (found.operation.parameters as OpenAPIV3.ParameterObject[]) || [],
      requestBody: found.operation.requestBody
        ? this.extractRequestBody(swagger, found.operation.requestBody)
        : null,
      responses: this.extractResponsesWithExamples(
        swagger,
        found.operation.responses || {},
      ),
    };
  }

  private extractRequestBody(
    swagger: OpenAPIV3.Document,
    requestBody: OpenAPIV3.RequestBodyObject | OpenAPIV3.ReferenceObject,
  ) {
    const requestBodyObject: OpenAPIV3.RequestBodyObject =
      '$ref' in requestBody
        ? this.resolveRequestBodyObjectRef(swagger, requestBody.$ref)
        : requestBody;

    const content: Record<string, unknown> = {};
    for (const [mediaType, mediaTypeObj] of Object.entries(
      requestBodyObject.content || {},
    )) {
      content[mediaType] = this.extractMediaTypeExample(swagger, mediaTypeObj);
    }

    return {
      description: requestBodyObject.description,
      required: requestBodyObject.required,
      content,
    };
  }
}
