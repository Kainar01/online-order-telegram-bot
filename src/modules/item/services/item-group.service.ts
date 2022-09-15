import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { InsertResult } from 'typeorm';
import type { Repository } from 'typeorm/repository/Repository';

import { ValidationException } from '@/modules/bot/exceptions/validation.exception';

import { ItemGroupEntity } from '../entities/item-group.entity';
import type { CreateItemGroupDto, CreateItemGroupRO } from '../interfaces/item-group.interface,';

@Injectable()
export class ItemGroupService {
  constructor(@InjectRepository(ItemGroupEntity) private itemGroupRepository: Repository<ItemGroupEntity>) {}

  public async findItemGroupByTitle(title: string) {
    return this.itemGroupRepository.findOne({ where: { title } });
  }

  public async findItemGroupById(id: number) {
    return this.itemGroupRepository.findOne({ where: { id } });
  }

  public async createItemGroup(dto: CreateItemGroupDto): Promise<CreateItemGroupRO> {
    const itemGroup = await this.itemGroupRepository
      .createQueryBuilder('ig')
      .insert()
      .values(dto)
      .orUpdate(['title'], ['title', 'shop_id'])
      .returning('id, title, shop_id as "shopId", (xmax = 0) as inserted')
      .execute()
      .then(({ raw }: InsertResult) => <CreateItemGroupRO>raw[0]);

    if (!itemGroup.inserted) {
      throw new ValidationException(`Группа вещей ${itemGroup.title} уже существует`);
    }

    return itemGroup;
  }

  public async getItemGroups(shopId: number) {
    return this.itemGroupRepository.find({ where: { shopId } });
  }
}
