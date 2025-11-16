import {
  CurrentUser,
  JwtAuthGuard,
  JwtAuthGuardWithPublic,
  Roles,
  RolesGuard,
} from '@huzaflix/common';
import {
  Body,
  Controller,
  Delete,
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
import type { Request, Response } from 'express';
import { Readable } from 'stream';
import { CreateApiDto } from 'src/api/dto/api/api-create.dto';
import { UpdateApiDto } from 'src/api/dto/api/api-update.dto';
import { ApiService } from 'src/api/services/api/api.service';
import { ReadableStream } from 'stream/web';

@Controller('apis')
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Get()
  @ApiOperation({ summary: 'Get all apis' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuardWithPublic)
  @ApiResponse({ status: 200, description: 'Fetched all apis successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?: { role: { name: string } },
  ) {
    return await this.apiService.findAll(
      {
        page,
        limit,
      },
      user?.role?.name,
    );
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

  @Get('category/:category')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuardWithPublic)
  @ApiOperation({ summary: 'Get all apis by category' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Fetched all apis by category successfully',
  })
  async findAllByCategory(
    @Param('category') category: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?: { role: { name: string } },
  ) {
    return await this.apiService.filterByCategory(
      category,
      user?.role?.name,
      page,
      limit,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get by ID' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuardWithPublic)
  @ApiResponse({ status: 200, description: 'Fetched successfully' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user?: { role: { name: string } },
  ) {
    return await this.apiService.findOneById(Number(id), user?.role?.name);
  }

  @Get('/pricing/:id')
  @ApiOperation({ summary: 'Pricing by api ID' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuardWithPublic)
  @ApiResponse({ status: 200, description: 'Fetched successfully' })
  async pricing(
    @Param('id') id: string,
    @CurrentUser() user?: { role: { name: string } },
  ) {
    return await this.apiService.pricing(Number(id), user?.role?.name);
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

  @Post(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate by ID' })
  @ApiResponse({ status: 200, description: 'Activated successfully' })
  async publish(@Param('id') id: number) {
    return await this.apiService.activate(id);
  }

  @Post(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate by ID' })
  @ApiResponse({ status: 200, description: 'Deactivated successfully' })
  async unpublish(@Param('id') id: number) {
    return await this.apiService.deactivate(id);
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

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete API' })
  @ApiResponse({ status: 200, description: 'Deleted successfully' })
  async delete(@Param('id') id: number) {
    await this.apiService.delete(id);
  }
}
