import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ItemModule } from '../item/item.module';
import { PurchaseItemEntity } from './entities/purchase-item.entity';
import { PurchaseEntity } from './entities/purchase.entity';
import { PurchaseItemService } from './services/purchase-item.service';
import { PurchaseService } from './services/purchase.service';

@Module({
  imports: [TypeOrmModule.forFeature([PurchaseEntity, PurchaseItemEntity]), ItemModule],
  providers: [PurchaseService, PurchaseItemService],
  exports: [PurchaseService, PurchaseItemService],
})
export class PurchaseModule {}
