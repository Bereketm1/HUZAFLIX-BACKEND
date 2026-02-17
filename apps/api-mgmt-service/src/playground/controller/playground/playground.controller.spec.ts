import { Test, TestingModule } from '@nestjs/testing';
import { PlaygroundController } from './playground.controller';
import { PlaygroundService } from 'src/playground/service/playground/playground.service';
import { ProxyPlaygroundRequestDto } from 'src/playground/dto/proxy-playground-request.dto';

describe('PlaygroundController', () => {
  let controller: PlaygroundController;

  const mockPlaygroundService = {
    getEndpointsFromSwagger: jest.fn(),
    proxyRequest: jest.fn(),
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

  it('should proxy request', async () => {
    const dto = {
      method: 'GET',
      path: '/users',
      api_test_key: 'test-key',
    } as ProxyPlaygroundRequestDto;
    mockPlaygroundService.proxyRequest.mockResolvedValue({ status: 200 });

    const res = await controller.proxy(1, dto);

    expect(mockPlaygroundService.proxyRequest).toHaveBeenCalledWith(1, dto);
    expect(res).toEqual({ status: 200 });
  });
});
