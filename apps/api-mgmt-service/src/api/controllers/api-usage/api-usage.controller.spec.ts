import { Test, TestingModule } from '@nestjs/testing';
import { ApiUsageController } from './api-usage.controller';
import { ApiUsageService } from '../../services/api-usage/api-usage.service';

describe('ApiUsageController', () => {
  let controller: ApiUsageController;
  let service: ApiUsageService;

  const mockService = {
    validateRequest: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApiUsageController],
      providers: [
        { provide: ApiUsageService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<ApiUsageController>(ApiUsageController);
    service = module.get<ApiUsageService>(ApiUsageService);
  });

  describe('validateRequest', () => {
    it('should call service.validateRequest', async () => {
      mockService.validateRequest.mockResolvedValue({ allowed: true });
      const result = await controller.validateRequest({ apiKey: 'key', path: '/path' });
      expect(result.allowed).toBe(true);
      expect(mockService.validateRequest).toHaveBeenCalledWith('key', '/path');
    });
  });
});
