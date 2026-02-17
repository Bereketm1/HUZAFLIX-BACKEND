import { decrypt } from '@huzaflix/common';
import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Api, ApiStatus } from 'src/api/entities/api.entity';
import { ApiUsageService } from 'src/api/services/api-usage/api-usage.service';
import { Repository } from 'typeorm';

@Injectable()
export class ProxyService {
  constructor(
    @InjectRepository(Api)
    private readonly apiRepository: Repository<Api>,
    private readonly apiUsageService: ApiUsageService,
  ) {}

  private toUpstreamUrl(
    basePath: string,
    pathSuffix: string,
    query: Request['query'],
  ): { url: string; internalPath: string } {
    const normalizedBase = basePath.endsWith('/')
      ? basePath.slice(0, -1)
      : basePath;
    const normalizedSuffix = pathSuffix ? `/${pathSuffix}` : '';
    const internalPath = `${normalizedBase}${normalizedSuffix}`;
    const url = new URL(internalPath);

    for (const [key, value] of Object.entries(query || {})) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        value.forEach((v) => {
          if (
            typeof v === 'string' ||
            typeof v === 'number' ||
            typeof v === 'boolean'
          ) {
            url.searchParams.append(key, String(v));
          }
        });
      } else {
        if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean'
        ) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return { url: url.toString(), internalPath };
  }

  private getConsumerApiKey(req: Request): string {
    const headerValue = req.headers['x-api-key'];
    const key = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    if (!key) {
      throw new UnauthorizedException(
        'Missing consumer API key in x-api-key header',
      );
    }

    return String(key);
  }

  async proxy(
    slug: string,
    pathSuffix: string,
    req: Request,
  ): Promise<{
    status: number;
    headers: { 'content-type': string | null };
    data: unknown;
  }> {
    const api = await this.apiRepository.findOne({
      where: { slug, status: ApiStatus.ACTIVE },
    });
    if (!api) {
      throw new NotFoundException(`Active API with slug "${slug}" not found`);
    }

    const consumerApiKey = this.getConsumerApiKey(req);
    const { url, internalPath } = this.toUpstreamUrl(
      api.base_path,
      pathSuffix,
      req.query,
    );

    const validation = await this.apiUsageService.validateRequest(
      consumerApiKey,
      internalPath,
    );
    if (!validation.allowed) {
      const reason = validation.reason || 'Request not allowed';
      if (
        reason.includes('Missing API Key') ||
        reason.includes('Invalid API Key') ||
        reason.includes('inactive') ||
        reason.includes('expired') ||
        reason.includes('revoked')
      ) {
        throw new UnauthorizedException(reason);
      }

      throw new ForbiddenException(reason);
    }

    const upstreamApiKey = decrypt(api.base_api_key);
    if (!upstreamApiKey) {
      throw new BadRequestException(
        `API with slug "${slug}" has no valid base API key`,
      );
    }

    const incomingHeaders = req.headers as Record<string, string | string[]>;
    const forwardedHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(incomingHeaders)) {
      const lowered = key.toLowerCase();
      if (
        lowered === 'host' ||
        lowered === 'x-api-key' ||
        lowered === 'authorization' ||
        lowered === 'content-length'
      ) {
        continue;
      }

      if (Array.isArray(value)) {
        forwardedHeaders[key] = value.join(', ');
      } else if (value !== undefined) {
        forwardedHeaders[key] = String(value);
      }
    }

    forwardedHeaders['x-api-key'] = upstreamApiKey;

    const method = req.method.toUpperCase();
    const hasBody = !['GET', 'HEAD'].includes(method);
    const requestBody = req.body as unknown;
    const bodyValue =
      hasBody && requestBody !== undefined && requestBody !== null
        ? requestBody
        : null;
    if (bodyValue && !forwardedHeaders['content-type']) {
      forwardedHeaders['content-type'] = 'application/json';
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: forwardedHeaders,
        body: bodyValue ? JSON.stringify(bodyValue) : undefined,
      });
    } catch (error) {
      throw new BadGatewayException(
        `Failed to reach upstream API: ${(error as Error).message}`,
      );
    }

    const responseContentType = response.headers.get('content-type') || '';
    const data: unknown = responseContentType.includes('application/json')
      ? ((await response.json()) as unknown)
      : await response.text();

    return {
      status: response.status,
      headers: {
        'content-type': response.headers.get('content-type'),
      },
      data,
    };
  }
}
