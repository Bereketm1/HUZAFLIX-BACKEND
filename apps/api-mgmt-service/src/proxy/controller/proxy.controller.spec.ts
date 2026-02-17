import { Test, TestingModule } from '@nestjs/testing';
import { ProxyController } from './proxy.controller';
import { ProxyService } from 'src/proxy/service/proxy.service';

describe('ProxyController', () => {
  let controller: ProxyController;

  const proxyService = {
    proxy: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProxyController],
      providers: [
        {
          provide: ProxyService,
          useValue: proxyService,
        },
      ],
    }).compile();

    controller = module.get<ProxyController>(ProxyController);
  });

  it('should proxy root path by slug', async () => {
    proxyService.proxy.mockResolvedValue({ status: 200 });
    const req = { method: 'GET', headers: {}, query: {} };
    const res = await controller.proxyRoot('weather', req as never);
    expect(proxyService.proxy).toHaveBeenCalledWith('weather', '', req);
    expect(res).toEqual({ status: 200 });
  });

  it('should proxy nested path by slug', async () => {
    proxyService.proxy.mockResolvedValue({ status: 200 });
    const req = { method: 'GET', headers: {}, query: {} };
    const res = await controller.proxyPath(
      'weather',
      'v1/current',
      req as never,
    );
    expect(proxyService.proxy).toHaveBeenCalledWith(
      'weather',
      'v1/current',
      req,
    );
    expect(res).toEqual({ status: 200 });
  });
});
