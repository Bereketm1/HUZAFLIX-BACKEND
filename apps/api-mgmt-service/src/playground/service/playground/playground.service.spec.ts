import { Test, TestingModule } from '@nestjs/testing';
import { PlaygroundService } from './playground.service';
import { ApiService } from 'src/api/services/api/api.service';

describe('PlaygroundService', () => {
  let service: PlaygroundService;

  const mockApiService = {
    findOneById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaygroundService,
        {
          provide: ApiService,
          useValue: mockApiService,
        },
      ],
    }).compile();

    service = module.get<PlaygroundService>(PlaygroundService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
