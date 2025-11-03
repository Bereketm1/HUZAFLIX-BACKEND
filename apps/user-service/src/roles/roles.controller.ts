import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard, Roles, RolesGuard } from '@huzaflix/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('administrator')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @ApiOperation({ summary: 'Get all roles' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @Get()
  async findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return await this.rolesService.findAll({ page, limit });
  }

  @ApiOperation({ summary: 'Get a role by ID' })
  @Get(':id')
  async findOne(@Param('id') id: number) {
    return await this.rolesService.findOneById(id);
  }

  @ApiOperation({ summary: 'Create a new role' })
  @Post()
  async create(@Body() createRoleDto: CreateRoleDto) {
    return await this.rolesService.create(createRoleDto);
  }

  @ApiOperation({ summary: 'Update a role by ID' })
  @Put(':id')
  async update(@Param('id') id: number, @Body() updateRoleDto: UpdateRoleDto) {
    return await this.rolesService.update(id, updateRoleDto);
  }

  @ApiOperation({ summary: 'Delete a role by ID' })
  @Delete(':id')
  async delete(@Param('id') id: number) {
    return await this.rolesService.delete(id);
  }
}
