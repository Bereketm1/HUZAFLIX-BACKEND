import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshGuard, ResetGuard } from '@huzaflix/common';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    refresh: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('') },
        },
      ],
    })
      .overrideGuard(RefreshGuard)
      .useValue({
        canActivate: () => true,
      })
      .overrideGuard(ResetGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should call authService.login and return its result', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: '123456',
      };
      const result = { access_token: 'jwt.token' };

      mockAuthService.login.mockResolvedValue(result);

      const response = await controller.login(loginDto);

      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(response).toEqual(result);
    });
  });

  describe('register', () => {
    it('should call authService.register and return its result', async () => {
      const registerDto: RegisterDto = {
        email: 'new@example.com',
        password: '123456',
      };
      const result = { message: 'User registered successfully' };

      mockAuthService.register.mockResolvedValue(result);

      const response = await controller.register(registerDto);

      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
      expect(response).toEqual(result);
    });
  });

  describe('refresh', () => {
    it('should call authService.refresh and return its result', async () => {
      const refreshToken = 'Bearer refresh.token';
      const result = {
        access_token: 'jwt.token',
        refresh_token: 'new.refresh.token',
      };

      mockAuthService.refresh.mockResolvedValue(result);

      const response = await controller.refresh(refreshToken);

      expect(mockAuthService.refresh).toHaveBeenCalledWith(
        refreshToken.split(' ')[1],
      );
      expect(response).toEqual(result);
    });
  });
});
