import { Test, TestingModule } from '@nestjs/testing';
import { ApiService } from './api.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { PaginatedResponse } from '@huzaflix/common';
import { Api, ApiStatus } from 'src/api/entities/api.entity';
import { CreateApiDto } from 'src/api/dto/api/api-create.dto';
import { UpdateApiDto } from 'src/api/dto/api/api-update.dto';

describe('ApiService', () => {
  let service: ApiService;

  const mockApiRepository: Partial<Repository<Api>> = {
    find: jest.fn(),
    findAndCount: jest.fn(),
    findOneById: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiService,
        {
          provide: getRepositoryToken(Api),
          useValue: mockApiRepository,
        },
      ],
    }).compile();

    service = module.get<ApiService>(ApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all APIs if page and limit are not provided', async () => {
      const apis = [{ id: '1' }, { id: '2' }];
      (mockApiRepository.find as jest.Mock).mockResolvedValue(apis);

      const result = await service.findAll({});

      expect(result).toEqual(apis);
      expect(mockApiRepository.find).toHaveBeenCalled();
    });

    it('should return paginated APIs if page and limit are provided', async () => {
      const apis = [{ id: '1' }, { id: '2' }];
      (mockApiRepository.findAndCount as jest.Mock).mockResolvedValue([
        apis,
        10,
      ]);

      const result = (await service.findAll({ page: 1, limit: 2 })) as {
        data: Api[];
        meta: PaginatedResponse;
      };

      expect(result.data).toEqual(apis);
      expect(result.meta).toBeInstanceOf(PaginatedResponse);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalPages).toBe(5);
      expect(result.meta.totalItems).toBe(10);
      expect(mockApiRepository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 2,
      });
    });
  });

  describe('findOneById', () => {
    it('should return API if found', async () => {
      const api = { id: '1' };
      (mockApiRepository.findOneById as jest.Mock).mockResolvedValue(api);

      const result = await service.findOneById(1);

      expect(result).toEqual(api);
      expect(mockApiRepository.findOneById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if API not found', async () => {
      (mockApiRepository.findOneById as jest.Mock).mockResolvedValue(null);

      await expect(service.findOneById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create and save a new API', async () => {
      const dto: CreateApiDto = {
        name: 'Test API',
        slug: 'test-api',
        base_path: '/test',
        version: '1.0',
        openapi_spec_key: 'key123',
        openapi_spec_url: 'https://example.com/spec',
        created_by: 'user1',
      };

      (mockApiRepository.create as jest.Mock).mockReturnValue(dto);
      (mockApiRepository.save as jest.Mock).mockResolvedValue(dto);

      const result = await service.create(dto);

      expect(mockApiRepository.create).toHaveBeenCalledWith(dto);
      expect(mockApiRepository.save).toHaveBeenCalledWith(dto);
      expect(result).toEqual(dto);
    });
  });

  describe('update', () => {
    it('should update an existing API', async () => {
      const existingApi = { id: '1', name: 'Old Name' };
      const dto: UpdateApiDto = { name: 'New Name' };

      (mockApiRepository.findOneById as jest.Mock).mockResolvedValue(
        existingApi,
      );
      (mockApiRepository.save as jest.Mock).mockImplementation((u) =>
        Promise.resolve(u),
      );

      const result = await service.update(1, dto);

      expect(result.name).toBe('New Name');
      expect(mockApiRepository.findOneById).toHaveBeenCalledWith('1');
      expect(mockApiRepository.save).toHaveBeenCalledWith({
        ...existingApi,
        ...dto,
      });
    });

    it('should throw NotFoundException if API not found', async () => {
      (mockApiRepository.findOneById as jest.Mock).mockResolvedValue(null);

      await expect(service.update(999, {} as UpdateApiDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('publish', () => {
    it('should publish an existing API', async () => {
      const existingApi = {
        id: '1',
        name: 'Old Name',
        status: ApiStatus.DRAFT,
      };

      (mockApiRepository.findOneById as jest.Mock).mockResolvedValue(
        existingApi,
      );
      (mockApiRepository.save as jest.Mock).mockImplementation((u) =>
        Promise.resolve(u),
      );

      const result = await service.publish(1);

      expect(result.status).toBe(ApiStatus.PUBLISHED);
      expect(mockApiRepository.findOneById).toHaveBeenCalledWith('1');
      expect(mockApiRepository.save).toHaveBeenCalledWith({
        ...existingApi,
        status: ApiStatus.PUBLISHED,
        published_at: new Date(),
      });
    });

    it('should throw NotFoundException if API not found', async () => {
      (mockApiRepository.findOneById as jest.Mock).mockResolvedValue(null);

      await expect(service.publish(999)).rejects.toThrow(NotFoundException);
    });
  });
});
