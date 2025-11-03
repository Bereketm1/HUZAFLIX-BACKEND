import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { JwtAuthGuard, RolesGuard } from '@huzaflix/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

describe('RolesController', () => {
  let controller: RolesController;

  const mockRolesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findOneByName: jest.fn(),
    findOneById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        {
          provide: RolesService,
          useValue: mockRolesService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: () => true,
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<RolesController>(RolesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call roleService.findAll and return list of roles', async () => {
      const roles = [
        { id: 1, name: 'adminstrator' },
        { id: 2, name: 'api_consumer' },
      ];
      mockRolesService.findAll.mockResolvedValue(roles);

      const result = await controller.findAll();

      expect(mockRolesService.findAll).toHaveBeenCalled();
      expect(result).toEqual(roles);
    });
  });

  describe('findOne', () => {
    it('should call roleService.findOneById and return a role', async () => {
      const role = { id: 1, name: 'administrator' };
      mockRolesService.findOneById.mockResolvedValue(role);

      const result = await controller.findOne(1);

      expect(mockRolesService.findOneById).toHaveBeenCalledWith(1);
      expect(result).toEqual(role);
    });
  });

  describe('create', () => {
    it('should call roleService.create and return the created role', async () => {
      const dto: CreateRoleDto = {
        name: 'new_role',
        description: 'New role description',
      };
      const createdRole = { id: 1, ...dto };
      mockRolesService.create.mockResolvedValue(createdRole);

      const result = await controller.create(dto);

      expect(mockRolesService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(createdRole);
    });
  });

  describe('update', () => {
    it('should call roleService.update and return the updated role', async () => {
      const dto: UpdateRoleDto = {
        name: 'updated_role',
        description: 'Updated role description',
      };
      const updatedRole = { id: 1, ...dto };
      mockRolesService.update.mockResolvedValue(updatedRole);

      const result = await controller.update(1, dto);

      expect(mockRolesService.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(updatedRole);
    });
  });
});
