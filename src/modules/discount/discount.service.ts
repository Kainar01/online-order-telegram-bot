import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import type { CreateDiscountDto, Discount } from './discount.interface';
import { DiscountItemGroupEntity } from './entities/discount-item-group.entity';
import { DiscountEntity } from './entities/discount.entity';

@Injectable()
export class DiscountService {
  constructor(@InjectRepository(DiscountEntity) private discountRepository: Repository<DiscountEntity>) {}

  public async createDiscount({ itemGroupIds, ...dto }: CreateDiscountDto): Promise<DiscountEntity> {
    return this.discountRepository.manager.transaction(async (entityManager: EntityManager) => {
      const discountRepository = entityManager.getRepository(DiscountEntity);
      const discountItemGroupRepository = entityManager.getRepository(DiscountItemGroupEntity);

      const discount = await discountRepository.save(dto);

      await discountItemGroupRepository.save(itemGroupIds.map((itemGroupId: number) => ({ itemGroupId, discountId: discount.id })));

      return discount;
    });
  }

  public async updateDiscountItemGroups(discountId: number, itemGroups: string[], entityManager: EntityManager) {
    const discountItemGroupRepository = entityManager.getRepository(DiscountItemGroupEntity);

    const itemGroupTitles = itemGroups.join(', ');
    await discountItemGroupRepository.query(
      `
      WITH "delete_old_item_groups" AS (
          DELETE FROM "item_group"
          WHERE "discount_id" = $1
          AND "title" NOT IN ( ${itemGroupTitles} )
      )
      INSERT INTO "item_group" ("title", "discount_id")
        SELECT item_group_title, $1 FROM unnest( ARRAY[${itemGroupTitles}] ) AS item_group_title
          WHERE NOT EXISTS (
              SELECT 1
              FROM "item_group" AS "ig"
              WHERE "ig"."discount_id" = $1 AND "ig"."title" = "item_group_title"
          )
    `,
      [discountId],
    );
  }

  public async getDiscountById(id: number): Promise<Discount | null> {
    return this.discountRepository.findOne({ where: { id } });
  }
}
