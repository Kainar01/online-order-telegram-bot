import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import _, { groupBy } from 'lodash';
import { EntityManager, In, Repository, UpdateResult } from 'typeorm';

import { normalizeNumber } from '@/common/utils/number';
import { ItemEntity } from '@/modules/item/entities/item.entity';
import type {
  CreateItemDto,
  ItemToPurchase,
  ItemWithQuantity,
  PurchaseTotals,
  UpdateItemDto,
  UpdateItemRO,
} from '@/modules/item/interfaces/item.interface';

@Injectable()
export class ItemService {
  constructor(@InjectRepository(ItemEntity) private itemRepository: Repository<ItemEntity>) {}

  public async findItemById(id: number) {
    return this.itemRepository.findOne({ where: { id } });
  }

  public async findItemsByIds(ids: number[]) {
    return this.itemRepository.find({ where: { id: In(ids) } });
  }

  public async findItemsByItemGroupId(itemGroupId: number) {
    return this.itemRepository.find({ where: { itemGroupId } });
  }

  public async createItem(dto: CreateItemDto): Promise<ItemEntity> {
    return this.itemRepository.save(dto);
  }

  public async createItems(dto: CreateItemDto[]): Promise<ItemEntity[]> {
    return this.itemRepository.save(dto);
  }

  public async updateItem(id: number, dto: UpdateItemDto): Promise<UpdateItemRO | null> {
    return this.itemRepository
      .createQueryBuilder('s')
      .update()
      .set(dto)
      .where('id = :id', { id })
      .returning(
        `id, title, price, quantity, image_id as "imageId",
        item_group_id as "itemGroupId", created_at as "createdAt", updated_at as "updatedAt"`,
      )
      .execute()
      .then(({ raw }: UpdateResult) => (<UpdateItemRO[]>raw)[0] || null);
  }

  public async addItemQuantity(id: number, quantity: number) {
    await this.itemRepository.update(id, { quantity: () => `quantity + ${quantity}` });
  }

  public async getPurchaseItemsForUpdate(items: number[], discountId: number | null, entityManager: EntityManager) {
    const purchaseItems: ItemToPurchase[] = await this.getPurchaseItemsWithLock(items, discountId, entityManager);

    const { outOfStockItems, inStockItems } = groupBy(purchaseItems, (item: ItemToPurchase) => (
      item.outOfStock ? 'outOfStockItems' : 'inStockItems'
    ));

    return {
      outOfStockItems: outOfStockItems || [],
      inStockItems: inStockItems || [],
    };
  }

  public countTotals(items: ItemToPurchase[], itemsToBuy: ItemWithQuantity[]) {
    const quantities = _.mapValues(_.keyBy(itemsToBuy, 'id'), 'quantity');
    const itemsWithQuantity = items.map((item:ItemToPurchase) => ({ ...item, quantity: quantities[item.id] }));

    const totals = items.reduce(
      (purchaseTotals: PurchaseTotals, item: ItemToPurchase) => ({
        total: purchaseTotals.total + normalizeNumber(item.price) * Number(quantities[item.id]),
        discountAmount: normalizeNumber(purchaseTotals.discountAmount) + normalizeNumber(item.discountAmount) * Number(quantities[item.id]),
      }),
      { total: 0, discountAmount: 0 },
    );
    return { totals, itemsWithQuantity };
  }

  public async decrementPurchaseItemsQuantity(itemIds: number[], entityManager: EntityManager) {
    const repository = entityManager.getRepository(ItemEntity);

    return repository
      .createQueryBuilder('i')
      .update()
      .set({ quantity: () => '"quantity" - 1' })
      .where('id IN (:...itemIds)', { itemIds })
      .returning('id, quantity, price, title')
      .execute()
      .then(({ raw }: UpdateResult) => <ItemToPurchase[]>raw);
  }

  private async getPurchaseItemsWithLock(
    itemIds: number[],
    discountId: number | null,
    entityManager: EntityManager,
  ): Promise<ItemToPurchase[]> {
    const qb = entityManager
      .createQueryBuilder(ItemEntity, 'i')
      .select(['i.id as "id"', 'i.title as "title"', '(i.quantity = 0) AS "outOfStock"', 'i.unit_price as "unitPrice"'])
      .setLock('pessimistic_write')
      .where('id IN (:...itemIds)', { itemIds });

    if (discountId) {
      return qb
        .clone()
        .addSelect(
          '("i"."price" * ( 1 - "d"."amount")) AS price, ( i.price * d.amount ) as "discountAmount", d.amount as "discountPercentage"',
        )
        .leftJoin('discount_item_group', 'dig', 'dig.item_group_id = i.item_group_id')
        .leftJoin('discount', 'd', 'd.id = :discountId and ( d.id = dig.discount_id OR d.id IS NULL)', { discountId })
        .getRawMany();
    }

    return qb.addSelect('i.price, 0::numeric as "discountAmount", 0::numeric as "discountPercentage"').getRawMany();
  }
}
