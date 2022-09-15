import { DiscountEntity } from '../../../modules/discount/entities/discount.entity';
import { Check, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Purchase, PurchaseStatus } from '../interfaces/purchase.interface';
import { PurchaseItemEntity } from './purchase-item.entity';

@Entity('purchase')
@Check('"total" >= 0')
@Check('"discount_amount" >= 0')
export class PurchaseEntity implements Purchase {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column('int', { nullable: true })
  discountId!: number | null;

  @Column('int', { nullable: true })
  chatId!: number | null;

  @Column('int', { nullable: false })
  shopId!: number;

  @Column({ type: 'enum', enum: PurchaseStatus, nullable: false, default: PurchaseStatus.PENDING })
  status!: PurchaseStatus;

  @Column('numeric', { nullable: false, precision: 10, scale: 2 })
  total!: number;

  @Column('numeric', { nullable: false, default: 0, precision: 10, scale: 2 })
  discountAmount!: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  @OneToMany(() => PurchaseItemEntity, (purchaseItem) => purchaseItem.purchase, {
    cascade: true,
    deferrable: "INITIALLY DEFERRED"
  })
  purchaseItems?: PurchaseItemEntity[];

  @ManyToOne(() => DiscountEntity, (discount) => discount.purchases, {
    onDelete: 'CASCADE',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'discount_id' })
  discount!: DiscountEntity;
}
