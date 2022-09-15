import { ItemGroupEntity } from '../../../modules/item/entities/item-group.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { DiscountEntity } from './discount.entity';
import type { DiscountItemGroup } from '../discount.interface';

@Entity('discount_item_group')
@Unique(['itemGroupId', 'discountId'])
export class DiscountItemGroupEntity implements DiscountItemGroup {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column('int', { nullable: false })
  itemGroupId!: number;

  @Column('int', { nullable: false })
  discountId!: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  @ManyToOne(() => ItemGroupEntity, (itemGroup) => itemGroup.discounts, {
    onDelete: 'CASCADE',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'item_group_id' })
  itemGroup!: ItemGroupEntity;

  @ManyToOne(() => DiscountEntity, (purchase) => purchase.itemGroups, {
    onDelete: 'CASCADE',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'discount_id' })
  discount!: DiscountEntity;
}
