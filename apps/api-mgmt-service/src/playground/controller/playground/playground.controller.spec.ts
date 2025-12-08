import { Test, TestingModule } from '@nestjs/testing';
import { PlaygroundController } from './playground.controller';
import { PlaygroundService } from 'src/playground/service/playground/playground.service';

describe('PlaygroundController', () => {
  let controller: PlaygroundController;

  const mockPlaygroundService = {
    getEndpointsFromSwagger: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlaygroundController],
      providers: [
        {
          provide: PlaygroundService,
          useValue: mockPlaygroundService,
        },
      ],
    }).compile();

    controller = module.get<PlaygroundController>(PlaygroundController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
