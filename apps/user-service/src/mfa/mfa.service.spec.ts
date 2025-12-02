import { Test, TestingModule } from '@nestjs/testing';
import { MfaService } from './mfa.service';
import { UsersService } from 'src/users/users.service';
import { MfaMailerService } from '@huzaflix/common';
import { Mfa } from './mfa.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SessionsService } from 'src/sessions/sessions.service';

describe('MfaService', () => {
  let service: MfaService;

  const mockUsersService = {
    findOneById: jest.fn(),
  };

  const mockMfaMailerService = {
    sendOtpEmail: jest.fn(),
  };

  const mockMfaRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
    decode: jest.fn(),
  };

  const mockSessionService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MfaService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: MfaMailerService, useValue: mockMfaMailerService },
        { provide: SessionsService, useValue: mockSessionService },
        { provide: getRepositoryToken(Mfa), useValue: mockMfaRepository },
      ],
    }).compile();

    service = module.get<MfaService>(MfaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMfa', () => {
    it('should throw BadRequestException if an active MFA exists', async () => {
      mockUsersService.findOneById.mockResolvedValue({
        id: 1,
        email: 'user@test.com',
      });
      mockMfaRepository.findOne.mockResolvedValue({
        id: 1,
        expired: false,
        createdAt: new Date(),
      });

      await expect(service.createMfa('1')).rejects.toThrow(BadRequestException);
    });

    it('should create new MFA and send OTP if none exists', async () => {
      const user = { id: 1, email: 'user@test.com' };
      const createdMfa = { otp_hash: 'hash', user };
      mockUsersService.findOneById.mockResolvedValue(user);
      mockMfaRepository.findOne.mockResolvedValue(null);
      mockMfaRepository.create.mockReturnValue({ otp_hash: 'hash', user });
      mockMfaRepository.save.mockResolvedValue(createdMfa);
      mockSessionService.create.mockResolvedValue({ id: 1, token: 'token' });

      const result = await service.createMfa('1');

      expect(typeof result).toBe('string');
      expect(result).toHaveLength(6);
      expect(mockMfaMailerService.sendOtpEmail).toHaveBeenCalledWith(
        user.email,
        expect.any(String),
        10,
      );
    });
  });

  describe('verifyMfa', () => {
    it('should return false if no active MFA exists', async () => {
      mockUsersService.findOneById.mockResolvedValue({ id: 1 });
      mockMfaRepository.findOne.mockResolvedValue(null);

      const result = await service.verifyMfa('123456', 1);
      expect(result).toMatchObject({
        verified: false,
        token: null,
      });
    });

    it('should throw UnauthorizedException if OTP does not match', async () => {
      const mfaRecord = {
        id: 1,
        otp_hash: 'hash',
        expired: false,
        createdAt: new Date(Date.now() - 3 * 60 * 1000),
      };
      mockUsersService.findOneById.mockResolvedValue({ id: 1 });
      mockMfaRepository.findOne.mockResolvedValue(mfaRecord);
      const bcryptCompare = jest.fn().mockResolvedValue(false);
      (bcrypt.compare as jest.Mock) = bcryptCompare;

      await expect(service.verifyMfa('123456', 1)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should expire MFA and return true if OTP matches', async () => {
      const mfaRecord = {
        id: 1,
        otp_hash: 'hash',
        expired: false,
        createdAt: new Date(Date.now() - 3 * 60 * 1000),
      };
      mockUsersService.findOneById.mockResolvedValue({ id: 1 });
      mockMfaRepository.findOne.mockResolvedValue(mfaRecord);
      const bcryptCompare = jest.fn().mockResolvedValue(true);
      (bcrypt.compare as jest.Mock) = bcryptCompare;
      mockMfaRepository.update.mockResolvedValue({});

      mockSessionService.create.mockResolvedValue({ id: 1, token: 'token' });

      const result = await service.verifyMfa('123456', 1);

      expect(result).toMatchObject({
        verified: true,
        token: 'token',
      });
      expect(mockMfaRepository.update).toHaveBeenCalledWith(
        { id: mfaRecord.id },
        { expired: true },
      );
    });
  });

  describe('resendOtp', () => {
    it('should expire previous MFA if exists and create new one', async () => {
      const user = { id: 1, email: 'user@test.com' };
      const prevMfa = {
        id: 1,
        expired: false,
        createdAt: new Date(Date.now() - 3 * 60 * 1000),
      };
      const newMfa = { otp_hash: 'hash2', user };

      mockUsersService.findOneById.mockResolvedValue(user);
      mockMfaRepository.findOne.mockResolvedValue(prevMfa);
      mockMfaRepository.update.mockResolvedValue({});
      mockMfaRepository.create.mockReturnValue({ otp_hash: 'hash2', user });
      mockMfaRepository.save.mockResolvedValue(newMfa);

      const result = await service.resendOtp('1');

      expect(mockMfaRepository.update).toHaveBeenCalledWith(
        { id: prevMfa.id },
        { expired: true },
      );
      expect(mockMfaMailerService.sendOtpEmail).toHaveBeenCalledWith(
        user.email,
        expect.any(String),
        10,
      );
      expect(result).toEqual(newMfa);
    });

    it('should create new MFA if no previous exists', async () => {
      const user = { id: 1, email: 'user@test.com' };
      const newMfa = { otp_hash: 'hash2', user };

      mockUsersService.findOneById.mockResolvedValue(user);
      mockMfaRepository.findOne.mockResolvedValue(null);
      mockMfaRepository.create.mockReturnValue({ otp_hash: 'hash2', user });
      mockMfaRepository.save.mockResolvedValue(newMfa);

      const result = await service.resendOtp('1');

      expect(mockMfaRepository.update).not.toHaveBeenCalled();
      expect(mockMfaMailerService.sendOtpEmail).toHaveBeenCalledWith(
        user.email,
        expect.any(String),
        10,
      );
      expect(result).toEqual(newMfa);
    });
  });
});
