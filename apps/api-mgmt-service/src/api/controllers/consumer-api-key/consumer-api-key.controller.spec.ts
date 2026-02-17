import { Test, TestingModule } from '@nestjs/testing';
import { ConsumerApiKeyController } from './consumer-api-key.controller';
import { ConsumerApiKeyService } from '../../services/consumer-api-key/consumer-api-key.service';
import { JwtAuthGuard } from '@huzaflix/common';
import { CreateConsumerApiKeyDto } from '../../dto/consumer-api-key/create-consumer-api-key.dto';
import { UpdateConsumerApiKeyDto } from '../../dto/consumer-api-key/update-consumer-api-key.dto';

describe('ConsumerApiKeyController', () => {
  let controller: ConsumerApiKeyController;

  const mockService = {
    createForUser: jest.fn(),
    activateForUser: jest.fn(),
    deactivateForUser: jest.fn(),
    revokeForUser: jest.fn(),
    updateExpiryForUser: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConsumerApiKeyController],
      providers: [
        {
          provide: ConsumerApiKeyService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ConsumerApiKeyController>(ConsumerApiKeyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create should call createForUser', async () => {
    const dto = { api_id: 1 } as CreateConsumerApiKeyDto;
    mockService.createForUser.mockResolvedValue({ id: '1' });

    await controller.create({ id: 5 }, dto);
    expect(mockService.createForUser).toHaveBeenCalledWith('5', dto);
  });

  it('activate should call activateForUser', async () => {
    mockService.activateForUser.mockResolvedValue({ id: '1' });

    await controller.activate({ id: 5 }, 1);
    expect(mockService.activateForUser).toHaveBeenCalledWith('5', 1);
  });

  it('deactivate should call deactivateForUser', async () => {
    mockService.deactivateForUser.mockResolvedValue({ id: '1' });

    await controller.deactivate({ id: 5 }, 1);
    expect(mockService.deactivateForUser).toHaveBeenCalledWith('5', 1);
  });

  it('revoke should call revokeForUser', async () => {
    mockService.revokeForUser.mockResolvedValue({ id: '1' });

    await controller.revoke({ id: 5 }, 1);
    expect(mockService.revokeForUser).toHaveBeenCalledWith('5', 1);
  });

  it('updateExpiry should call updateExpiryForUser', async () => {
    const dto = { expires_in_days: 90 } as UpdateConsumerApiKeyDto;
    mockService.updateExpiryForUser.mockResolvedValue({ id: '1' });

    await controller.updateExpiry({ id: 5 }, 1, dto);
    expect(mockService.updateExpiryForUser).toHaveBeenCalledWith('5', 1, dto);
  });
});
