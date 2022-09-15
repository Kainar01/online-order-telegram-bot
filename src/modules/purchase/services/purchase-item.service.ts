import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { PurchaseItemEntity } from '../entities/purchase-item.entity';
import type { CreatePurchaseItemDto } from '../interfaces/purchase-item.interface';

@Injectable()
export class PurchaseItemService {
  constructor(@InjectRepository(PurchaseItemEntity) private purchaseItemRepository: Repository<PurchaseItemEntity>) {}

  public async createPurchaseItem(dto: CreatePurchaseItemDto): Promise<PurchaseItemEntity> {
    return this.purchaseItemRepository.save(dto);
  }

  public async createPurchaseItems(dto: CreatePurchaseItemDto[], entityManager: EntityManager): Promise<PurchaseItemEntity[]> {
    return entityManager.save(PurchaseItemEntity, dto);
  }
}
