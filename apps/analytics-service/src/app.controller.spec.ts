import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { of, throwError } from 'rxjs';
import { AnalyticsService } from './analytics/services/analytics.service';

describe('AppController', () => {
  let appController: AppController;

  const dashboardClientMock = {
    send: jest.fn(() => of({ users: 100, active: 80 })),
  };

  const mockAnalyticsService = {
    getDailyStats: jest.fn().mockResolvedValue({
      totalApiHitsToday: {
        value: 100,
        percentage: 10,
        change: 'increase',
        period: 'daily',
      },
      totalSuccessHits: 90,
      totalErrorHits: 10,
    }),
    getTimeGraph: jest.fn().mockResolvedValue([]),
    getLatencyGraph: jest.fn().mockResolvedValue([]),
    getSystemHealth: jest.fn().mockResolvedValue({
      total: 100,
      success: 90,
      errors: 10,
      successRate: 90,
      errorRate: 10,
      uptimePct: 90,
      downtimePct: 10,
    }),
    getApiHealth: jest.fn().mockResolvedValue([
      {
        path: '/api/foo',
        total: 10,
        success: 9,
        errors: 1,
        successRate: 90,
        errorRate: 10,
        avgLatency: 50,
      },
    ]),
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

  describe('getApiReport', () => {
    it('should include totalUsers from dashboard client', async () => {
      // dashboardClientMock.send returns { users:100, active:80 } by default
      const report = await appController.getApiReport();
      expect(report).toHaveProperty('totalApiHitsToday');
      expect(report).toHaveProperty('totalUsers');
    });

    it('should still return a report when dashboard client fails', async () => {
      dashboardClientMock.send.mockImplementationOnce(() => throwError(() => new Error('unavailable')));

      const report = await appController.getApiReport();
      expect(report).toHaveProperty('totalApiHitsToday');
      expect(report.totalUsers).toBeNull();
    });
  });

  describe('health endpoints', () => {
    it('should return system health', async () => {
      const res = await appController.getSystemHealth(undefined, undefined);
      expect(res).toHaveProperty('uptimePct', 90);
      expect(mockAnalyticsService.getSystemHealth).toHaveBeenCalled();
    });

    it('should return api health list', async () => {
      const res = await appController.getApiHealth(undefined, undefined);
      expect(Array.isArray(res)).toBe(true);
      expect(mockAnalyticsService.getApiHealth).toHaveBeenCalled();
    });
  });
});
