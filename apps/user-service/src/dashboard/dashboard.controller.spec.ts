import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';

describe('DashboardController', () => {
  let controller: DashboardController;

  const mockDashboardService = {
    totalUsers: jest.fn(),
    newUsersToday: jest.fn(),
    newUsersThisWeek: jest.fn(),
    newUsersThisMonth: jest.fn(),
    latestUsers: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: mockDashboardService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: () => true,
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      const mockStats = {
        total: 100,
        today: 5,
        week: 20,
        month: 50,
        latest: [{ id: 1, email: 'a@example.com' }],
      };

      mockDashboardService.totalUsers.mockResolvedValue(mockStats.total);
      mockDashboardService.newUsersToday.mockResolvedValue(mockStats.today);
      mockDashboardService.newUsersThisWeek.mockResolvedValue(mockStats.week);
      mockDashboardService.newUsersThisMonth.mockResolvedValue(mockStats.month);
      mockDashboardService.latestUsers.mockResolvedValue(mockStats.latest);

      const result = await controller.getUserStats();

      expect(mockDashboardService.totalUsers).toHaveBeenCalled();
      expect(mockDashboardService.newUsersToday).toHaveBeenCalled();
      expect(mockDashboardService.newUsersThisWeek).toHaveBeenCalled();
      expect(mockDashboardService.newUsersThisMonth).toHaveBeenCalled();
      expect(mockDashboardService.latestUsers).toHaveBeenCalled();

      expect(result).toEqual(mockStats);
    });
  });
});
