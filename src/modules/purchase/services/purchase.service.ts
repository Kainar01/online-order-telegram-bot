import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isEmpty } from 'lodash';
import { EntityManager, Repository, UpdateResult } from 'typeorm';

import { ValidationException } from '@/modules/bot/exceptions/validation.exception';
import type { ItemToPurchase, ItemToPurchaseWithQuantity, ItemWithQuantity } from '@/modules/item/interfaces/item.interface';
import { ItemService } from '@/modules/item/services/item.service';

import { PurchaseEntity } from '../entities/purchase.entity';
import type { CreatePurchaseItemDto } from '../interfaces/purchase-item.interface';
import { CreatePurchaseDto, MakePurchaseDto, PurchaseStatus, UpdatePurchaseDto, UpdatePurchaseRO } from '../interfaces/purchase.interface';
import { PurchaseItemService } from './purchase-item.service';

@Injectable()
export class PurchaseService {
  constructor(
    @InjectRepository(PurchaseEntity) private purchaseRepository: Repository<PurchaseEntity>,
    private itemService: ItemService,
    private purchaseItemService: PurchaseItemService,
  ) {}

  public async createPurchase(dto: CreatePurchaseDto, entityManager?: EntityManager): Promise<PurchaseEntity> {
    const repository = entityManager ? entityManager.getRepository(PurchaseEntity) : this.purchaseRepository;
    return repository.save(dto);
  }

  public async updatePurchase(id: number, dto: UpdatePurchaseDto): Promise<UpdatePurchaseRO | null> {
    return this.purchaseRepository
      .createQueryBuilder('s')
      .update()
      .set(dto)
      .where('id = :id', { id })
      .returning(
        `id, total, status, chat_id as "chatId", shop_id as "shopId", 
        discount_price as "discountPrice", created_at as "createdAt", updated_at as "updatedAt"`,
      )
      .execute()
      .then(({ raw }: UpdateResult) => (<UpdatePurchaseRO[]>raw)[0] || null);
  }

  public async makePurchase(shopId: number, { items, discountId, total }: MakePurchaseDto) {
    return this.purchaseRepository.manager.transaction(async (entityManager: EntityManager) => {
      const itemIds = items.map((item: ItemWithQuantity) => item.id);
      const itemsToPurchase = await this.itemService.getPurchaseItemsForUpdate(itemIds, discountId, entityManager);

      if (!isEmpty(itemsToPurchase.outOfStockItems)) {
        const outOfStockMsg = itemsToPurchase.outOfStockItems.map((item: ItemToPurchase) => item.title).join(',');
        throw new ValidationException(`Этих товаров нет в наличии ${outOfStockMsg}`);
      }

      if (isEmpty(itemsToPurchase.inStockItems)) {
        throw new ValidationException('Нет товаров');
      }

      const { totals, itemsWithQuantity } = this.itemService.countTotals(itemsToPurchase.inStockItems, items);

      if (total !== totals.total) {
        throw new ValidationException('Цены на товары поменялись');
      }

      const purchase = await entityManager.save(PurchaseEntity, {
        total: totals.total,
        discountAmount: totals.discountAmount,
        discountId,
        shopId,
        chatId: null,
      });

      const purchaseItemDtos: CreatePurchaseItemDto[] = itemsWithQuantity.map((item: ItemToPurchaseWithQuantity) => ({
        price: item.price,
        discountAmount: item.discountAmount,
        quantity: item.quantity,
        itemId: item.id,
        unitPrice: item.unitPrice,
        purchaseId: purchase.id,
        status: PurchaseStatus.PAID,
      }));

      await this.purchaseItemService.createPurchaseItems(purchaseItemDtos, entityManager);
    });
  }
}
