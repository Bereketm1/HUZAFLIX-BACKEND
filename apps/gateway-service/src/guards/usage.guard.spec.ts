import { Test, TestingModule } from '@nestjs/testing';
import { UsageGuard } from './usage.guard';
import { ClientProxy } from '@nestjs/microservices';
import { HttpException } from '@nestjs/common';
import { of } from 'rxjs';

describe('UsageGuard', () => {
  let guard: UsageGuard;
  let client: ClientProxy;

  const mockClient = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsageGuard,
        { provide: 'API_MGMT_SERVICE', useValue: mockClient },
      ],
    }).compile();

    guard = module.get<UsageGuard>(UsageGuard);
    client = module.get<ClientProxy>('API_MGMT_SERVICE');
  });

  const mockContext = {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: { 'x-api-key': 'test-key' },
        url: '/test/path',
      }),
    }),
  } as any;

  it('should allow request if validation succeeds', async () => {
    mockClient.send.mockReturnValue(of({ allowed: true }));

    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
    expect(mockClient.send).toHaveBeenCalledWith('validate_request', {
      apiKey: 'test-key',
      path: '/test/path',
    });
  });

  it('should throw exception if validation fails', async () => {
    mockClient.send.mockReturnValue(of({ allowed: false, reason: 'Test Reason' }));

    await expect(guard.canActivate(mockContext)).rejects.toThrow(HttpException);
  });
});
