import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ChatEntity } from '../chat/chat.entity';
import { ItemGroupEntity } from '../item/entities/item-group.entity';
import type { Shop } from './shop.interface';

@Entity('shop')
export class ShopEntity implements Shop {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column('int', { nullable: false, unique: true })
  ownerChatId!: number;

  @Column('varchar', { nullable: false })
  title!: string;

  @Column('boolean', { default: false })
  isPublished!: boolean;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  @OneToMany(() => ItemGroupEntity, (entity) => entity.shop, {
    cascade: true,
  })
  itemGroups!: ItemGroupEntity[];

  @ManyToOne(() => ChatEntity, (chat) => chat.shops, {
    onDelete: 'CASCADE',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'shop_id' })
  ownerChat!: ChatEntity;
}
