import {
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  getMinioBucketNameSingleton,
  getMinioClientSingleton,
} from '../../internal/singletons';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly bucketName = getMinioBucketNameSingleton();
  private readonly minio = getMinioClientSingleton();

  private getMinioClient(): Minio.Client {
    if (!this.minio) {
      throw new InternalServerErrorException('MinIO client not initialized');
    }

    return this.minio;
  }

  async onModuleInit() {
    const minio = this.getMinioClient();

    const bucketName = this.bucketName || 'main';

    try {
      const exists = await minio.bucketExists(bucketName);

      if (!exists) {
        await minio.makeBucket(bucketName, 'us-east-1');
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new InternalServerErrorException(
        'Failed to ensure MinIO bucket',
        message,
      );
    }
  }

  async listBuckets() {
    try {
      return await this.getMinioClient().listBuckets();
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to list buckets',
        (error as { message: string }).message,
      );
    }
  }

  async getFile(filename: string) {
    try {
      const url = await this.getMinioClient().presignedUrl(
        'GET',
        this.bucketName || 'main',
        filename,
      );
      return { url };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new InternalServerErrorException('Failed to get a file', message);
    }
  }

  async uploadFile(file: Express.Multer.File) {
    const filename = `${randomUUID()}-${file.originalname}`;

    try {
      const minio = this.getMinioClient();

      await minio.putObject(
        this.bucketName || 'main',
        filename,
        file.buffer,
        file.size,
        {
          'Content-Type': file.mimetype,
        },
      );

      const url = await minio.presignedUrl(
        'GET',
        this.bucketName || 'main',
        filename,
      );

      return {
        filename,
        url,
        message: 'File uploaded successfully',
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new InternalServerErrorException('Failed to upload file', message);
    }
  }
}
