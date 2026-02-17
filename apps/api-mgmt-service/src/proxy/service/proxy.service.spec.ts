import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import * as common from '@huzaflix/common';
import { Api, ApiStatus } from 'src/api/entities/api.entity';
import { ApiUsageService } from 'src/api/services/api-usage/api-usage.service';
import { ProxyService } from './proxy.service';
import type { Request } from 'express';

describe('ProxyService', () => {
  let service: ProxyService;
  let fetchMock: jest.SpyInstance;

  const apiRepository = {
    findOne: jest.fn(),
  };

  const apiUsageService = {
    validateRequest: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(common, 'decrypt').mockReturnValue('main-api-key');
    fetchMock = jest.spyOn(global, 'fetch');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProxyService,
        {
          provide: getRepositoryToken(Api),
          useValue: apiRepository,
        },
        {
          provide: ApiUsageService,
          useValue: apiUsageService,
        },
      ],
    }).compile();

    service = module.get<ProxyService>(ProxyService);
  });

  afterEach(() => {
    fetchMock.mockRestore();
    jest.restoreAllMocks();
  });

  it('should throw when consumer api key is missing', async () => {
    apiRepository.findOne.mockResolvedValue({
      id: 1,
      slug: 'weather',
      status: ApiStatus.ACTIVE,
      base_path: 'https://api.example.com',
      base_api_key: 'enc-main-key',
    } as Api);

    await expect(
      service.proxy('weather', 'v1/current', {
        method: 'GET',
        headers: {},
        query: {},
      } as unknown as Request),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should validate usage and forward with main api key', async () => {
    apiRepository.findOne.mockResolvedValue({
      id: 1,
      slug: 'weather',
      status: ApiStatus.ACTIVE,
      base_path: 'https://api.example.com',
      base_api_key: 'enc-main-key',
    } as Api);
    apiUsageService.validateRequest.mockResolvedValue({ allowed: true });
    fetchMock.mockResolvedValue({
      status: 200,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ ok: true }),
      text: () => Promise.resolve(''),
    } as unknown as Response);

    const result = await service.proxy('weather', 'v1/current', {
      method: 'POST',
      headers: {
        'x-api-key': 'consumer-key',
        authorization: 'bearer user-token',
      },
      query: { city: 'kigali' },
      body: { unit: 'metric' },
    } as unknown as Request);

    expect(apiUsageService.validateRequest).toHaveBeenCalledWith(
      'consumer-key',
      'https://api.example.com/v1/current',
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('https://api.example.com/v1/current?city=kigali'),
      expect.any(Object),
    );
    const [, fetchOptions] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(fetchOptions.headers).toMatchObject({
      'x-api-key': 'main-api-key',
    });
    expect(result).toEqual({
      status: 200,
      headers: { 'content-type': 'application/json' },
      data: { ok: true },
    });
  });
});
