import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Favourite } from 'src/api/entities/favourites.entity';
import { Repository } from 'typeorm';

@Injectable()
export class FavouritesService {
  constructor(
    @InjectRepository(Favourite)
    private favouriteRepository: Repository<Favourite>,
  ) {}

  async getAllFavourites(userId: number): Promise<Favourite[]> {
    return this.favouriteRepository.find({
      where: { userId },
      relations: ['api'],
    });
  }

  async createFavourite(userId: number, api_id: number): Promise<Favourite> {
    const favourite = this.favouriteRepository.create({ userId, api_id });
    return this.favouriteRepository.save(favourite);
  }

  async deleteFavourite(userId: number, api_id: number): Promise<void> {
    await this.favouriteRepository.delete({ userId, api_id });
  }
}
