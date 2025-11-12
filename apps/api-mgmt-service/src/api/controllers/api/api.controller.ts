import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CreateApiDto } from 'src/api/dto/api/api-create.dto';
import { UpdateApiDto } from 'src/api/dto/api/api-update.dto';
import { ApiService } from 'src/api/services/api/api.service';

@Controller('api')
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

  @Get(':id')
  @ApiOperation({ summary: 'Get by ID' })
  @ApiResponse({ status: 200, description: 'Fetched successfully' })
  async findOne(@Param('id') id: number) {
    const user = await this.apiService.findOneById(id);
    return user;
  }

  @Post()
  @ApiOperation({ summary: 'Create' })
  @ApiResponse({ status: 201, description: 'Created successfully' })
  async create(@Body() createApiDto: CreateApiDto) {
    return await this.apiService.create(createApiDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update by ID' })
  @ApiResponse({ status: 200, description: 'Updated successfully' })
  async update(@Param('id') id: number, @Body() updateApiDto: UpdateApiDto) {
    return await this.apiService.update(id, updateApiDto);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish by ID' })
  @ApiResponse({ status: 200, description: 'Published successfully' })
  async publish(@Param('id') id: number) {
    return await this.apiService.publish(id);
  }
}
