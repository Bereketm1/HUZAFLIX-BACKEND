import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { of } from 'rxjs';

describe('AppController', () => {
  let appController: AppController;

  const dashboardClientMock = {
    send: jest.fn(() => of({ users: 100, active: 80 })),
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
});
