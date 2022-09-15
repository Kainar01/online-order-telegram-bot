import { PurchaseItemEntity } from '../../../modules/purchase/entities/purchase-item.entity';
import {
  Check,
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
import type { Item } from '../interfaces/item.interface';
import { ItemGroupEntity } from './item-group.entity';

@Entity('item')
@Check('"quantity" >= 0')
@Check('"price" >= 0 and "unit_price" >=0 and "unit_price" < "price"')
@Unique(['title', 'itemGroupId'])
export class ItemEntity implements Item {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column('int', { nullable: false })
  itemGroupId!: number;

  @Column('varchar', { nullable: false })
  title!: string;

  @Column('varchar', { nullable: true })
  imageId!: string | null;

  @Column('numeric', { nullable: false, precision: 10, scale: 2 })
  price!: number;

  @Column('numeric', { nullable: false, precision: 10, scale: 2 })
  unitPrice!: number;

  @Column('bigint', { nullable: false })
  quantity!: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  @ManyToOne(() => ItemGroupEntity, (itemGroup) => itemGroup.items, {
    onDelete: 'CASCADE',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'item_group_id' })
  public itemGroup!: ItemGroupEntity;

  @OneToMany(() => PurchaseItemEntity, (entity) => entity.item, {
    cascade: true,
  })
  items!: PurchaseItemEntity[];
}
