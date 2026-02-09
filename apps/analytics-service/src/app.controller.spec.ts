import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { of } from 'rxjs';
import { AnalyticsService } from './analytics/services/analytics.service';

describe('AppController', () => {
  let appController: AppController;
  let analyticsService: AnalyticsService;

  const dashboardClientMock = {
    send: jest.fn(() => of({ users: 100, active: 80 })),
  };

  const mockAnalyticsService = {
    getDailyStats: jest.fn().mockResolvedValue({
      totalApiHitsToday: { value: 100, percentage: 10, change: 'increase', period: 'daily' },
      totalSuccessHits: 90,
      totalErrorHits: 10,
    }),
    getTimeGraph: jest.fn().mockResolvedValue([]),
    getLatencyGraph: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: 'DASHBOARD_SERVICE',
          useValue: dashboardClientMock,
        },
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    analyticsService = app.get<AnalyticsService>(AnalyticsService);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('getUserStats', () => {
    it('should return user stats from the dashboard client', async () => {
      const result = await appController.getUserStats();
      expect(result).toEqual({ users: 100, active: 80 });
      expect(dashboardClientMock.send).toHaveBeenCalledWith(
        'get_user_stats',
        {},
      );
    });
  });
});
