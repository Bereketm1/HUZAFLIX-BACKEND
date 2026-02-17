import { Test, TestingModule } from '@nestjs/testing';
import { PlaygroundService } from './playground.service';
import { ApiService } from 'src/api/services/api/api.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ApiKey, KeyStatus } from 'src/api/entities/api-key.entity';
import { UnauthorizedException } from '@nestjs/common';
import * as common from '@huzaflix/common';

describe('PlaygroundService', () => {
  let service: PlaygroundService;
  let fetchMock: jest.SpyInstance;

  const mockApiService = {
    findOneById: jest.fn(),
    getDocs: jest.fn(),
  };

  const mockApiKeyRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(common, 'decrypt').mockReturnValue('test-key');
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaygroundService,
        {
          provide: ApiService,
          useValue: mockApiService,
        },
        {
          provide: getRepositoryToken(ApiKey),
          useValue: mockApiKeyRepo,
        },
      ],
    }).compile();

    service = module.get<PlaygroundService>(PlaygroundService);
    fetchMock = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchMock.mockRestore();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getEndpointResponses should return dereferenced response schemas with example', async () => {
    mockApiService.findOneById.mockResolvedValue({
      id: 1,
      openapi_spec_url: 'http://example.com/spec.json',
    });
    mockApiService.getDocs.mockResolvedValue('http://example.com/spec.json');

    const openApiDoc = {
      openapi: '3.0.3',
      paths: {
        '/users': {
          get: {
            operationId: 'getUsers',
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/UserResponse',
                    },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          UserResponse: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              name: { type: 'string', example: 'John' },
            },
          },
        },
      },
    };

    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(openApiDoc),
    } as Response);

    const result = await service.getEndpointResponses(1, 'getUsers');

    expect(result.responses['200']).toEqual({
      description: 'OK',
      headers: undefined,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              name: { type: 'string', example: 'John' },
            },
          },
          example: {
            id: 1,
            name: 'John',
          },
        },
      },
    });
  });

  it('proxyRequest should throw when neither consumer nor test key is provided', async () => {
    await expect(
      service.proxyRequest(1, {
        method: 'GET',
        path: '/users',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('proxyRequest should forward request using stored test key and never user key', async () => {
    mockApiService.findOneById.mockResolvedValue({
      id: 1,
      base_path: 'https://api.example.com',
      test_api_key: 'enc-test-key',
    });

    mockApiKeyRepo.findOne.mockResolvedValue({
      status: KeyStatus.ACTIVE,
      revoked_at: null,
      expires_at: null,
      api: { id: 1 },
    });

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (key: string) =>
          key.toLowerCase() === 'content-type' ? 'application/json' : null,
      },
      json: () => Promise.resolve({ ok: true }),
      text: () => Promise.resolve(''),
    } as unknown as Response);

    const result = await service.proxyRequest(1, {
      method: 'POST',
      path: '/users',
      consumer_api_key: 'consumer-key',
      headers: {
        'x-api-key': 'should-not-pass-through',
      },
      body: { name: 'john' },
    });

    expect(fetchMock).toHaveBeenCalled();
    const [calledUrl, calledOptions] = fetchMock.mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(calledUrl).toContain('https://api.example.com/users');
    expect(calledOptions.headers).toMatchObject({
      'x-api-key': 'test-key',
      'content-type': 'application/json',
    });
    expect(result.status).toBe(200);
  });
});
