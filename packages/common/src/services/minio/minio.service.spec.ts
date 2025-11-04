import { InternalServerErrorException } from '@nestjs/common';
import {
  getMinioClientSingleton,
  getMinioBucketNameSingleton,
} from '../../internal/singletons';
import { MinioService } from './minio.service';

jest.mock('../../internal/singletons', () => ({
  getMinioClientSingleton: jest.fn(),
  getMinioBucketNameSingleton: jest.fn(),
}));

describe('FilesService', () => {
  let service: MinioService;
  let mockMinio: {
    listBuckets: jest.Mock;
    presignedUrl: jest.Mock;
    putObject: jest.Mock;
  };

  beforeEach(() => {
    mockMinio = {
      listBuckets: jest.fn(),
      presignedUrl: jest.fn(),
      putObject: jest.fn(),
    };

    (getMinioClientSingleton as jest.Mock).mockReturnValue(mockMinio);
    (getMinioBucketNameSingleton as jest.Mock).mockReturnValue('main');

    service = new MinioService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listBuckets', () => {
    it('should list buckets successfully', async () => {
      const mockBuckets = [{ name: 'main' }];
      mockMinio.listBuckets.mockResolvedValue(mockBuckets);

      const result = await service.listBuckets();

      expect(mockMinio.listBuckets).toHaveBeenCalled();
      expect(result).toEqual(mockBuckets);
    });

    it('should throw InternalServerErrorException when MinIO client not initialized', async () => {
      (getMinioClientSingleton as jest.Mock).mockReturnValue(null);
      service = new MinioService();

      await expect(service.listBuckets()).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException on MinIO failure', async () => {
      mockMinio.listBuckets.mockRejectedValue(new Error('Connection failed'));

      await expect(service.listBuckets()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getFile', () => {
    it('should return a presigned URL successfully', async () => {
      const mockUrl = 'https://example.com/file.jpg';
      mockMinio.presignedUrl.mockResolvedValue(mockUrl);

      const result = await service.getFile('file.jpg');

      expect(mockMinio.presignedUrl).toHaveBeenCalledWith(
        'GET',
        'main',
        'file.jpg',
      );
      expect(result).toEqual({ url: mockUrl });
    });

    it('should throw InternalServerErrorException on presignedUrl failure', async () => {
      mockMinio.presignedUrl.mockRejectedValue(
        new Error('URL generation failed'),
      );

      await expect(service.getFile('file.jpg')).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw if MinIO client is not initialized', async () => {
      (getMinioClientSingleton as jest.Mock).mockReturnValue(null);
      service = new MinioService();

      await expect(service.getFile('file.jpg')).rejects.toThrow(
        'Minio client not initialized',
      );
    });
  });

  describe('uploadFile', () => {
    const mockFile = {
      originalname: 'test.jpg',
      size: 1024,
      mimetype: 'image/jpeg',
      buffer: Buffer.from('mock data'),
    } as Express.Multer.File;

    it('should upload file and return success with URL', async () => {
      mockMinio.putObject.mockResolvedValue(undefined);
      mockMinio.presignedUrl.mockResolvedValue('https://example.com/test.jpg');

      const result = await service.uploadFile(mockFile);

      expect(mockMinio.putObject).toHaveBeenCalledWith(
        'main',
        expect.stringMatching(/test\.jpg$/),
        expect.any(Buffer),
        mockFile.size,
        { 'Content-Type': mockFile.mimetype },
      );
      expect(result).toEqual({
        filename: expect.stringMatching(/test\.jpg$/) as string,
        url: 'https://example.com/test.jpg',
        message: 'File uploaded successfully',
      });
    });

    it('should throw InternalServerErrorException on upload failure', async () => {
      mockMinio.putObject.mockRejectedValue(new Error('Upload failed'));

      await expect(service.uploadFile(mockFile)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw if MinIO client is not initialized', async () => {
      (getMinioClientSingleton as jest.Mock).mockReturnValue(null);
      service = new MinioService();

      await expect(service.uploadFile(mockFile)).rejects.toThrow(
        'Minio client not initialized',
      );
    });
  });
});
