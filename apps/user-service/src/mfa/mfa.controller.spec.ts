import { Test, TestingModule } from '@nestjs/testing';
import { MfaController } from './mfa.controller';
import { MfaService } from './mfa.service';

describe('MfaController', () => {
  let controller: MfaController;

  const mockMfaService = {
    createMfa: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MfaController],
      providers: [{ provide: MfaService, useValue: mockMfaService }],
    }).compile();

    controller = module.get<MfaController>(MfaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
