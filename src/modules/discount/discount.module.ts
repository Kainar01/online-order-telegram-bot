import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DiscountService } from './discount.service';
import { DiscountItemGroupEntity } from './entities/discount-item-group.entity';
import { DiscountEntity } from './entities/discount.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DiscountEntity, DiscountItemGroupEntity])],
  providers: [DiscountService],
  exports: [DiscountService],
})
export class DiscountModule {}
