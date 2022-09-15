import type { ItemEntity } from '@/modules/item/entities/item.entity';
import { Check, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { PurchaseItem } from '../interfaces/purchase-item.interface';
import { PurchaseEntity } from './purchase.entity';

@Entity('purchase_item')
@Check('"discount_amount" >= 0.00')
@Check('"quantity" >= 0')
@Check('"price" >= 0 and "unit_price" >=0')
export class PurchaseItemEntity implements PurchaseItem {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column('int', { nullable: false })
  itemId!: number;

  @Column('int', { nullable: false })
  purchaseId!: number;

  @Column('numeric', { nullable: false, precision: 10, scale: 2 })
  unitPrice!: number;

  @Column('numeric', { nullable: false, precision: 10, scale: 2 })
  price!: number;

  @Column('numeric', { nullable: false, default: 0, precision: 10, scale: 2 })
  discountAmount!: number;

  @Column('bigint', { nullable: false })
  quantity!: number;

  @ManyToOne(() => PurchaseEntity, (purchase) => purchase.purchaseItems, {
    onDelete: 'CASCADE',
    onUpdate: 'NO ACTION',
    deferrable: "INITIALLY DEFERRED"
  })
  @JoinColumn({ name: 'purchase_id' })
  purchase!: PurchaseEntity;

  @ManyToOne(() => PurchaseEntity, (purchase) => purchase.purchaseItems, {
    onDelete: 'CASCADE',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'item_id' })
  item!: ItemEntity;
}
