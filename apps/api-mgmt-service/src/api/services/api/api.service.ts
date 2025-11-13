import { MinioService, paginate, PaginatedResponse } from '@huzaflix/common';
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
    const api = await this.apiRepository.findOneById(id.toString());
    if (!api) {
      throw new NotFoundException(`API with id ${id} not found`);
    }
    return api;
  }

  async create(data: CreateApiDto & { created_by: string }): Promise<Api> {
    const api = this.apiRepository.create(data);
    return this.apiRepository.save(api);
  }

  async update(id: number, data: UpdateApiDto): Promise<Api> {
    const api = await this.findOneById(id);
    if (!api) {
      throw new NotFoundException(`API with id ${id} not found`);
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

  async uploadDocs(id: number, file: Express.Multer.File): Promise<Api> {
    const api = await this.findOneById(id);
    if (!api) {
      throw new NotFoundException(`API with id ${id} not found`);
    }
    const uploadFile = await this.minioService.uploadFile(file);
    api.openapi_spec_url =
      process.env.NODE_ENV === 'production'
        ? `https://${process.env.SERVER_HOST}/api-management/apis/docs/${uploadFile.filename}`
        : `http://${process.env.SERVER_HOST}/api/api-management/apis/docs/${uploadFile.filename}`;
    return this.apiRepository.save(api);
  }

  async getDocs(filename: string): Promise<string> {
    const fileUrl = await this.minioService.getFile(filename);
    return fileUrl?.url;
  }
}
