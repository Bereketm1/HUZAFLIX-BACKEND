import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import {
  CurrentUser,
  JwtAuthGuard,
  JwtAuthGuardWithPublic,
  Roles,
  RolesGuard,
} from '@huzaflix/common';
import { PlanService } from 'src/subscription/services/plan/plan.service';
import { CreateSubscriptionPlanDto } from 'src/subscription/dto/plan/plan-create.dto';
import { UpdateSubscriptionPlanDto } from 'src/subscription/dto/plan/plan-update.dto';

@Controller('plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Get()
  @ApiOperation({ summary: 'Get all plans' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuardWithPublic)
  @ApiResponse({ status: 200, description: 'Fetched all plans successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?: { role: { name: string } },
  ) {
    return await this.planService.findAll(
      {
        page,
        limit,
      },
      user?.role?.name,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get plan by ID' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuardWithPublic)
  @ApiResponse({ status: 200, description: 'Fetched successfully' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user?: { role: { name: string } },
  ) {
    const plan = await this.planService.findOneById(
      Number(id),
      user?.role?.name,
    );
    if (!plan) {
      throw new NotFoundException(`Plan with id ${id} not found`);
    }
    return plan;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create plan' })
  @ApiResponse({ status: 201, description: 'Created successfully' })
  async create(@Body() dto: CreateSubscriptionPlanDto) {
    return await this.planService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update plan by ID' })
  @ApiResponse({ status: 200, description: 'Updated successfully' })
  async update(
    @Param('id') id: number,
    @Body() dto: UpdateSubscriptionPlanDto,
  ) {
    return await this.planService.update(id, dto);
  }

  @Post(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate by ID' })
  @ApiResponse({ status: 200, description: 'Activated successfully' })
  async publish(@Param('id') id: number) {
    return await this.planService.activate(id);
  }

  @Post(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate by ID' })
  @ApiResponse({ status: 200, description: 'Deactivated successfully' })
  async unpublish(@Param('id') id: number) {
    return await this.planService.deactivate(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete plan' })
  @ApiResponse({ status: 200, description: 'Deleted successfully' })
  async delete(@Param('id') id: number) {
    await this.planService.delete(id);
  }
}
