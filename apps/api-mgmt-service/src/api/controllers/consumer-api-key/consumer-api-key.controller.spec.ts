import { Test, TestingModule } from '@nestjs/testing';
import { ConsumerApiKeyController } from './consumer-api-key.controller';
import { ConsumerApiKeyService } from '../../services/consumer-api-key/consumer-api-key.service';
import { JwtAuthGuard } from '@huzaflix/common';
import { CreateConsumerApiKeyDto } from '../../dto/consumer-api-key/create-consumer-api-key.dto';
import { UpdateConsumerApiKeyDto } from '../../dto/consumer-api-key/update-consumer-api-key.dto';

describe('ConsumerApiKeyController', () => {
  let controller: ConsumerApiKeyController;

  const mockService = {
    findAllForUser: jest.fn(),
    createForUser: jest.fn(),
    updateForUser: jest.fn(),
    revokeForUser: jest.fn(),
  };

  beforeEach(async () => {
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

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it("should return the user's keys", async () => {
      const keys = [{ id: 1 }, { id: 2 }];
      mockService.findAllForUser.mockResolvedValue(keys);

      const user: { id: number } = { id: 10 };
      const result = await controller.findAll(user);

      expect(mockService.findAllForUser).toHaveBeenCalledWith(String(user.id));
      expect(result).toBe(keys);
    });
  });

  describe('create', () => {
    it('should create a new key for the user', async () => {
      const dto: Partial<CreateConsumerApiKeyDto> = { name: 'abc' };
      const created = { id: 1, key: 'PREF_secret', name: 'abc' };
      mockService.createForUser.mockResolvedValue(created);

      const user: { id: number } = { id: 5 };
      const res = await controller.create(user, dto as CreateConsumerApiKeyDto);

      expect(mockService.createForUser).toHaveBeenCalledWith(
        String(user.id),
        dto,
      );
      expect(res).toBe(created);
    });
  });

  describe('update', () => {
    it('should call updateForUser with parsed id', async () => {
      const dto: Partial<UpdateConsumerApiKeyDto> = { name: 'updated' };
      const updated = { id: 1, name: 'updated' };
      mockService.updateForUser.mockResolvedValue(updated);

      const user: { id: number } = { id: 3 };
      const res = await controller.update(
        user,
        1 as number,
        dto as UpdateConsumerApiKeyDto,
      );

      expect(mockService.updateForUser).toHaveBeenCalledWith(
        String(user.id),
        1,
        dto,
      );
      expect(res).toBe(updated);
    });
  });

  describe('remove', () => {
    it('should call revokeForUser with parsed id', async () => {
      const revoked = { id: 2, revoked_at: new Date() };
      mockService.revokeForUser.mockResolvedValue(revoked);

      const user: { id: number } = { id: 23 };
      const res = await controller.remove(user, 2 as number);

      expect(mockService.revokeForUser).toHaveBeenCalledWith(
        String(user.id),
        2,
      );
      expect(res).toBe(revoked);
    });
  });
});
