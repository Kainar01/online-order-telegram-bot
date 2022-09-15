import { DiscountItemGroupEntity } from '../../../modules/discount/entities/discount-item-group.entity';
import { ShopEntity } from '../../../modules/shop/shop.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import type { ItemGroup } from '../interfaces/item-group.interface,';
import { ItemEntity } from './item.entity';

@Entity('item_group')
@Unique(['title', 'shopId'])
export class ItemGroupEntity implements ItemGroup {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id!: number;

  @Column('int', { nullable: true, name: 'chat_id' })
  chatId!: number | null;

  @Column('int', { nullable: false, name: 'shop_id' })
  shopId!: number;

  @Column('varchar', { nullable: false, name: 'title' })
  title!: string;

  @Column('boolean', { default: false, name: 'deleted' })
  deleted!: boolean;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP', name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => ItemEntity, (item) => item.itemGroup, {
    cascade: true,
  })
  items!: ItemEntity[];

  @OneToMany(() => DiscountItemGroupEntity, (discount) => discount.itemGroup, {
    cascade: true,
  })
  discounts!: DiscountItemGroupEntity[];

  @ManyToOne(() => ShopEntity, (shop) => shop.itemGroups, {
    onDelete: 'CASCADE',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'shop_id' })
  shop!: ShopEntity;
}
