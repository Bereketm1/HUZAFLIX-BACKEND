import {
  Body,
  Controller,
  Get,
  Param,
  Delete,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '@huzaflix/common';
import { RolesGuard } from '@huzaflix/common';
import { Roles } from '@huzaflix/common';
import { UserGuard } from '@huzaflix/common';

@ApiTags('users')
@Controller('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('administrator')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Fetched all users successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return await this.userService.findAll({
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'Fetched user successfully' })
  @Roles('api_consumer', 'administrator')
  @UseGuards(UserGuard)
  async findOne(@Param('id') id: number) {
    const user = await this.userService.findOneById(id);
    return user;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'Created user successfully' })
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.userService.create(createUserDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({ status: 200, description: 'Updated user successfully' })
  @Roles('api_consumer', 'administrator')
  @UseGuards(UserGuard)
  async update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
    return await this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiResponse({ status: 200, description: 'Deleted user successfully' })
  @Roles('api_consumer', 'administrator')
  @UseGuards(UserGuard)
  async remove(@Param('id') id: number) {
    await this.userService.remove(id);
    return { message: `User ${id} Deleted` };
  }
}
