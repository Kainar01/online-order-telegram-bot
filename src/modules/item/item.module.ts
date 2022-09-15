import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ItemGroupEntity } from './entities/item-group.entity';
import { ItemEntity } from './entities/item.entity';
import { ItemGroupService } from './services/item-group.service';
import { ItemService } from './services/item.service';

@Module({
  imports: [TypeOrmModule.forFeature([ItemEntity, ItemGroupEntity])],
  providers: [ItemService, ItemGroupService],
  exports: [ItemService, ItemGroupService],
})
export class ItemModule {}
