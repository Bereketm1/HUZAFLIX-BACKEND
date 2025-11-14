import {
  decrypt,
  encrypt,
  MinioService,
  paginate,
  PaginatedResponse,
} from '@huzaflix/common';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateApiDto } from 'src/api/dto/api/api-create.dto';
import { UpdateApiDto } from 'src/api/dto/api/api-update.dto';
import { Api, ApiStatus } from 'src/api/entities/api.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ApiService {
  constructor(
    @InjectRepository(Api)
    private readonly apiRepository: Repository<Api>,
    private readonly minioService: MinioService,
  ) {}

  async findAll({
    page,
    limit,
  }: {
    page?: number;
    limit?: number;
  }): Promise<{ data: Api[]; meta: PaginatedResponse } | Api[]> {
    if (!page || !limit) {
      return this.apiRepository.find();
    }
    const [apis, total] = await this.apiRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });

    return paginate(apis, page, limit, total);
  }

  async findOneById(id: number): Promise<Api | null> {
    const api = await this.apiRepository.findOne({
      where: { id: id },
    });
    if (!api) {
      throw new NotFoundException(`API with id ${id} not found`);
    }
    return api;
  }

  async create(data: CreateApiDto & { created_by: string }): Promise<Api> {
    const api = this.apiRepository.create(data);
    api.base_api_key = encrypt(data.base_api_key);
    return this.apiRepository.save(api);
  }

  async update(id: number, data: UpdateApiDto): Promise<Api> {
    const api = await this.findOneById(id);
    if (!api) {
      throw new NotFoundException(`API with id ${id} not found`);
    }

    if (data.base_api_key) {
      if (decrypt(api.base_api_key) !== data.base_api_key) {
        data.base_api_key = encrypt(data.base_api_key);
      }
    }

    Object.assign(api, data);
    return this.apiRepository.save(api);
  }

  async publish(id: number): Promise<Api> {
    const api = await this.findOneById(id);
    if (!api) {
      throw new NotFoundException(`API with id ${id} not found`);
    }
    api.status = ApiStatus.PUBLISHED;
    api.published_at = new Date();
    return this.apiRepository.save(api);
  }

  async unpublish(id: number): Promise<Api> {
    const api = await this.findOneById(id);
    if (!api) {
      throw new NotFoundException(`API with id ${id} not found`);
    }
    api.status = ApiStatus.DRAFT;
    api.published_at = null;
    return this.apiRepository.save(api);
  }

  async getUniqueApiCategories(): Promise<string[]> {
    const categories = await this.apiRepository
      .createQueryBuilder('api')
      .select('DISTINCT api.category', 'category')
      .getRawMany();

    return categories.map((row: { category: string }) => row.category);
  }

  async filterByCategory(
    category: string,
    page?: number,
    limit?: number,
  ): Promise<{ data: Api[]; meta: PaginatedResponse } | Api[]> {
    if (!page || !limit) {
      return this.apiRepository.findBy({ category });
    }

    const [apis, total] = await this.apiRepository.findAndCount({
      where: { category },
      skip: (page - 1) * limit,
      take: limit,
    });

    return paginate(apis, page, limit, total);
  }

  async uploadDocs(id: number, file: Express.Multer.File): Promise<Api> {
    const api = await this.findOneById(id);
    if (!api) {
      throw new NotFoundException(`API with id ${id} not found`);
    }
    const uploadFile = await this.minioService.uploadFile(file);
    api.openapi_spec_url =
      process.env.NODE_ENV === 'production'
        ? `http://${process.env.SERVER_HOST}/api-management/apis/docs/${uploadFile.filename}`
        : `http://${process.env.SERVER_HOST}/api/api-management/apis/docs/${uploadFile.filename}`;
    return this.apiRepository.save(api);
  }

  async getDocs(filename: string): Promise<string> {
    const fileUrl = await this.minioService.getFile(filename);
    return fileUrl?.url;
  }
}
