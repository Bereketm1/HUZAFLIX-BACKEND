import { CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '@huzaflix/common';
import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { Readable } from 'stream';
import { CreateApiDto } from 'src/api/dto/api/api-create.dto';
import { UpdateApiDto } from 'src/api/dto/api/api-update.dto';
import { ApiService } from 'src/api/services/api/api.service';
import { ReadableStream } from 'stream/web';
import { Api } from 'src/api/entities/api.entity';

@Controller('apis')
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Get()
  @ApiOperation({ summary: 'Get all apis' })
  @ApiResponse({ status: 200, description: 'Fetched all apis successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return await this.apiService.findAll({
      page,
      limit,
    });
  }

  @Get('/categories')
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({
    status: 200,
    description: 'Fetched all categories successfully',
  })
  async findAllCategories() {
    return await this.apiService.getUniqueApiCategories();
  }

  @Get(':category')
  @ApiOperation({ summary: 'Get all apis by category' })
  @ApiResponse({
    status: 200,
    description: 'Fetched all apis by category successfully',
  })
  async findAllByCategory(@Param('category') category: string) {
    return await this.apiService.filterByCategory(category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get by ID' })
  @ApiResponse({ status: 200, description: 'Fetched successfully' })
  async findOne(@Param('id') id: string): Promise<Api | null> {
    console.log('findOne', id);
    console.log('findOne', this.apiService.findOneById(Number(id)));
    return await this.apiService.findOneById(Number(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create' })
  @ApiResponse({ status: 201, description: 'Created successfully' })
  async create(
    @Body() createApiDto: CreateApiDto,
    @CurrentUser() user: { id: string },
  ) {
    return await this.apiService.create({
      ...createApiDto,
      created_by: user.id,
    });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update by ID' })
  @ApiResponse({ status: 200, description: 'Updated successfully' })
  async update(@Param('id') id: number, @Body() updateApiDto: UpdateApiDto) {
    return await this.apiService.update(id, updateApiDto);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish by ID' })
  @ApiResponse({ status: 200, description: 'Published successfully' })
  async publish(@Param('id') id: number) {
    return await this.apiService.publish(id);
  }

  @Post(':id/unpublish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish by ID' })
  @ApiResponse({ status: 200, description: 'Published successfully' })
  async unpublish(@Param('id') id: number) {
    return await this.apiService.unpublish(id);
  }

  @Post(':id/upload-docs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload OpenAPI Spec' })
  @ApiResponse({ status: 200, description: 'Uploaded successfully' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param('id') id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.apiService.uploadDocs(id, file);
  }

  @Get('/docs/:filename')
  @ApiOperation({ summary: 'Get OpenAPI Spec' })
  @ApiResponse({ status: 200, description: 'Retrieved successfully' })
  async getDocs(@Param('filename') filename: string, @Res() res: Response) {
    try {
      const url = await this.apiService.getDocs(filename);

      const response = await fetch(url);
      if (!response.ok || !response.body) {
        throw new Error(`MinIO responded with ${response.status}`);
      }

      const nodeStream = Readable.fromWeb(response.body as ReadableStream<any>);

      res.setHeader('Content-Type', 'application/json');
      nodeStream.pipe(res);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to serve OpenAPI spec');
    }
  }
}
