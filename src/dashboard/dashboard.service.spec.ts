import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/users/users.entity';

const mockQueryBuilder = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  getCount: jest.fn(),
  getMany: jest.fn(),
  getRawMany: jest.fn(),
};

const mockUserRepository = {
  createQueryBuilder: jest.fn(() => mockQueryBuilder),
};

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('totalUsers', () => {
    it('should return total count of api_consumer users', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(5);

      const result = await service.totalUsers();

      expect(mockUserRepository.createQueryBuilder).toHaveBeenCalledWith(
        'user',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'role.name = :roleName',
        { roleName: 'api_consumer' },
      );
      expect(result).toBe(5);
    });
  });

  describe('newUsersToday', () => {
    it('should count users created today', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(3);

      const result = await service.newUsersToday();

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.createdAt >= :start',
        expect.any(Object),
      );
      expect(result).toBe(3);
    });
  });

  describe('newUsersThisWeek', () => {
    it('should count users created this week', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(7);

      const result = await service.newUsersThisWeek();

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.createdAt >= :start',
        expect.any(Object),
      );
      expect(result).toBe(7);
    });
  });

  describe('newUsersThisMonth', () => {
    it('should count users created this month', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(10);

      const result = await service.newUsersThisMonth();

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.createdAt >= :start',
        expect.any(Object),
      );
      expect(result).toBe(10);
    });
  });

  describe('usersByMonth', () => {
    it('should return user counts grouped by month', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { month: '1', count: '2' },
        { month: '2', count: '4' },
      ]);
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.usersByMonth(2025);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'role.name = :roleName',
        { roleName: 'api_consumer' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'EXTRACT(YEAR FROM user.createdAt) = :year',
        { year: 2025 },
      );
      expect(result).toEqual([
        { month: 1, count: 2 },
        { month: 2, count: 4 },
      ]);
    });
  });

  describe('latestUsers', () => {
    it('should return the latest users', async () => {
      const mockUsers = [{ id: 1 }, { id: 2 }];
      mockQueryBuilder.getMany.mockResolvedValue(mockUsers);

      const result = await service.latestUsers();

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'user.createdAt',
        'DESC',
      );
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockUsers);
    });
  });
});
