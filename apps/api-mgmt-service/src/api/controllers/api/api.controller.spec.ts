import { Test, TestingModule } from '@nestjs/testing';
import { ApiController } from './api.controller';
import { PaginatedResponse } from '@huzaflix/common';
import { NotFoundException } from '@nestjs/common';
import { ApiService } from 'src/api/services/api/api.service';
import { CreateApiDto } from 'src/api/dto/api/api-create.dto';
import { UpdateApiDto } from 'src/api/dto/api/api-update.dto';

describe('ApiController', () => {
  let controller: ApiController;

  const mockApiService = {
    findAll: jest.fn(),
    findOneById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApiController],
      providers: [
        {
          provide: ApiService,
          useValue: mockApiService,
        },
      ],
    }).compile();

    controller = module.get<ApiController>(ApiController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call apiService.findAll and return list of APIs', async () => {
      const apis = [
        { id: '1', name: 'API 1' },
        { id: '2', name: 'API 2' },
      ];
      const paginated = {
        data: apis,
        meta: new PaginatedResponse(1, 2, 1),
      };
      mockApiService.findAll.mockResolvedValue(paginated);

      const result = await controller.findAll(1, 10);

      expect(mockApiService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
      expect(result).toEqual(paginated);
    });
  });

  describe('findOne', () => {
    it('should call apiService.findOneById and return the API', async () => {
      const api = { id: '1', name: 'API 1' };
      mockApiService.findOneById.mockResolvedValue(api);

      const result = await controller.findOne(1);

      expect(mockApiService.findOneById).toHaveBeenCalledWith(1);
      expect(result).toEqual(api);
    });

    it('should throw NotFoundException if API not found', async () => {
      mockApiService.findOneById.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should call apiService.create and return the created API', async () => {
      const dto: CreateApiDto = {
        name: 'New API',
        slug: 'new-api',
        base_path: '/new',
        version: '1.0',
        openapi_spec_key: 'key123',
        openapi_spec_url: 'https://example.com/spec',
        created_by: 'user1',
      };

      const createdApi = { id: '1', ...dto };
      mockApiService.create.mockResolvedValue(createdApi);

      const result = await controller.create(dto);

      expect(mockApiService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(createdApi);
    });
  });

  describe('update', () => {
    it('should call apiService.update and return the updated API', async () => {
      const dto: UpdateApiDto = { name: 'Updated API' };
      const updatedApi = { id: '1', name: 'Updated API' };
      mockApiService.update.mockResolvedValue(updatedApi);

      const result = await controller.update(1, dto);

      expect(mockApiService.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(updatedApi);
    });

    it('should throw NotFoundException if API to update is not found', async () => {
      const dto: UpdateApiDto = { name: 'Updated API' };
      mockApiService.update.mockRejectedValue(new NotFoundException());

      await expect(controller.update(999, dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
