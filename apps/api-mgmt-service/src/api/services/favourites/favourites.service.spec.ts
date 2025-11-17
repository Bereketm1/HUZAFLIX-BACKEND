import { Test, TestingModule } from '@nestjs/testing';
import { FavouritesService } from './favourites.service';
import { Repository } from 'typeorm';
import { Favourite } from 'src/api/entities/favourites.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('FavouritesService', () => {
  let service: FavouritesService;

  const mockFavouriteRepository: Partial<Repository<Favourite>> = {
    find: jest.fn(),
    findAndCount: jest.fn(),
    findOneById: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavouritesService,
        {
          provide: getRepositoryToken(Favourite),
          useValue: mockFavouriteRepository,
        },
      ],
    }).compile();

    service = module.get<FavouritesService>(FavouritesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
