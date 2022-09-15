import { PurchaseEntity } from '../../../modules/purchase/entities/purchase.entity';
import { Check, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { Discount } from '../discount.interface';
import { DiscountItemGroupEntity } from './discount-item-group.entity';

@Entity('discount')
@Check('"amount" >= 0.00 and "amount" <= 1.00')
export class DiscountEntity implements Discount {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column('varchar', { nullable: false, unique: true })
  title!: string;

  @Column('decimal', { nullable: false, precision: 5, scale: 4 })
  amount!: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  @OneToMany(() => DiscountItemGroupEntity, (discountItemGroup) => discountItemGroup.discount, {
    cascade: true,
  })
  itemGroups!: DiscountItemGroupEntity[];

  @OneToMany(() => PurchaseEntity, (purchase) => purchase.discount, {
    cascade: true,
  })
  purchases!: PurchaseEntity[];
}
