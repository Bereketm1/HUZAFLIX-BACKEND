import { Test, TestingModule } from '@nestjs/testing';
import { ApiService } from './api.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { MinioService, PaginatedResponse } from '@huzaflix/common';
import { Api, ApiStatus } from 'src/api/entities/api.entity';
import { CreateApiDto } from 'src/api/dto/api/api-create.dto';
import { UpdateApiDto } from 'src/api/dto/api/api-update.dto';

jest.mock('@huzaflix/common', (): unknown => {
  const actual: object = jest.requireActual('@huzaflix/common');
  return {
    ...actual,
    encrypt: jest.fn().mockReturnValue('encrypted-value'),
  };
});

describe('ApiService', () => {
  let service: ApiService;

  const mockApiRepository: Partial<Repository<Api>> = {
    find: jest.fn(),
    findAndCount: jest.fn(),
    findOneById: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockMinioService = {
    uploadFile: jest.fn(),
    getFile: jest.fn(),
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
        {
          provide: MinioService,
          useValue: mockMinioService,
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
        where: { status: ApiStatus.PUBLISHED },
      });
    });
  });

  describe('findOneById', () => {
    it('should return API if found', async () => {
      const api = { id: '1', status: ApiStatus.PUBLISHED };
      (mockApiRepository.findOne as jest.Mock).mockResolvedValue(api);

      const result = await service.findOneById(1);

      expect(result).toEqual(api);
      expect(mockApiRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 1,
          status: ApiStatus.PUBLISHED,
        },
      });
    });

    it('should throw NotFoundException if API not found', async () => {
      (mockApiRepository.findOne as jest.Mock).mockResolvedValue(null);

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
        base_api_key: 'key123',
        category: 'category1',
        tags: ['tag1', 'tag2'],
      };

      const req = {
        ...dto,
        created_by: '1',
        base_api_key: 'encrypted-value',
      };

      (mockApiRepository.create as jest.Mock).mockReturnValue({
        ...dto,
        created_by: '1',
      });

      (mockApiRepository.save as jest.Mock).mockResolvedValue(req);

      const result = await service.create({ ...dto, created_by: '1' });

      expect(mockApiRepository.create).toHaveBeenCalledWith({
        ...dto,
        created_by: '1',
      });

      expect(mockApiRepository.save).toHaveBeenCalledWith(req);
      expect(result).toEqual(req);
    });
  });

  describe('update', () => {
    it('should update an existing API', async () => {
      const existingApi = { id: '1', name: 'Old Name' };
      const dto: UpdateApiDto = { name: 'New Name' };

      (mockApiRepository.findOneBy as jest.Mock).mockResolvedValue(existingApi);
      (mockApiRepository.save as jest.Mock).mockImplementation((u) =>
        Promise.resolve(u),
      );

      const result = await service.update(1, dto);

      expect(result.name).toBe('New Name');
      expect(mockApiRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(mockApiRepository.save).toHaveBeenCalledWith({
        ...existingApi,
        ...dto,
      });
    });

    it('should throw NotFoundException if API not found', async () => {
      (mockApiRepository.findOneBy as jest.Mock).mockResolvedValue(null);

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

      (mockApiRepository.findOneBy as jest.Mock).mockResolvedValue(existingApi);
      (mockApiRepository.save as jest.Mock).mockImplementation((u) =>
        Promise.resolve(u),
      );

      const result = await service.publish(1);

      expect(result.status).toBe(ApiStatus.PUBLISHED);
      expect(mockApiRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(mockApiRepository.save).toHaveBeenCalledWith({
        ...existingApi,
        status: ApiStatus.PUBLISHED,
        published_at: new Date(),
      });
    });

    it('should throw NotFoundException if API not found', async () => {
      (mockApiRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      await expect(service.publish(999)).rejects.toThrow(NotFoundException);
    });
  });
});
