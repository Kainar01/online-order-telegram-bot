import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ShopEntity } from './shop.entity';
import { ShopService } from './shop.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShopEntity]),
  ],
  providers: [ShopService],
  exports: [ShopService],
})
export class ShopModule {}
