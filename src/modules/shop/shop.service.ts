import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InsertResult, Repository, UpdateResult } from 'typeorm';

import { ValidationException } from '../bot/exceptions/validation.exception';
import { ShopEntity } from './shop.entity';
import type { CreateShopDto, CreateShopRO, UpdateShopDto, UpdateShopRO } from './shop.interface';

@Injectable()
export class ShopService {
  constructor(@InjectRepository(ShopEntity) private shopRepository: Repository<ShopEntity>) {}

  public async findShopByChatId(chatId: number) {
    return this.shopRepository.findOne({ where: { ownerChatId: chatId } });
  }

  public async createShop(dto: CreateShopDto): Promise<CreateShopRO> {
    const shop = await this.shopRepository
      .createQueryBuilder('s')
      .insert()
      .values(dto)
      .orUpdate(['owner_chat_id'], ['owner_chat_id'])
      .returning('id, title, owner_chat_id as "ownerChatId", (xmax = 0) as inserted')
      .execute()
      .then(({ raw }: InsertResult) => <CreateShopRO>raw[0]);

    if (!shop.inserted) {
      throw new ValidationException(`Шоп ${shop.title} уже существует`);
    }
    return shop;
  }

  public async updateShop(id: number, dto: UpdateShopDto): Promise<UpdateShopRO | null> {
    return this.shopRepository
      .createQueryBuilder('s')
      .update()
      .set(dto)
      .where('id = :id', { id })
      .returning(
        'id, title, owner_chat_id as "ownerChatId", is_published as "isPublished", created_at as "createdAt", updated_at as "updatedAt"',
      )
      .execute()
      .then(({ raw }: UpdateResult) => (<UpdateShopRO[]>raw)[0] || null);
  }
}
