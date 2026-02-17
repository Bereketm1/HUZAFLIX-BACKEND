import { Test, TestingModule } from '@nestjs/testing';
import { PlaygroundService } from './playground.service';
import { ApiService } from 'src/api/services/api/api.service';

describe('PlaygroundService', () => {
  let service: PlaygroundService;
  let fetchMock: jest.SpyInstance;

  const mockApiService = {
    findOneById: jest.fn(),
    getDocs: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaygroundService,
        {
          provide: ApiService,
          useValue: mockApiService,
        },
      ],
    }).compile();

    service = module.get<PlaygroundService>(PlaygroundService);
    fetchMock = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchMock.mockRestore();
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
});
