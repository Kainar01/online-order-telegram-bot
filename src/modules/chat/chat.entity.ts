import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ShopEntity } from '../shop/shop.entity';

import { Chat, ChatType, ChatGroupType } from './chat.interface';

@Entity('chat')
export class ChatEntity implements Chat {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id!: number;

  @Column('bigint', { nullable: false, name: 'telegram_chat_id', unique: true })
  telegramChatId!: number;

  @Column('varchar', { nullable: false, name: 'name' })
  name!: string;

  @Column({ type: 'enum', enum: ChatType, nullable: false, name: 'type' })
  type!: ChatType;

  @Index()
  @Column({ type: 'enum', enum: ChatGroupType, nullable: true, default: null, name: 'chat_group_type', unique: true })
  chatGroupType!: ChatGroupType | null;

  @Column('boolean', { nullable: false, default: false, name: 'verified' })
  verified!: boolean;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  @OneToMany(() => ShopEntity, (shop) => shop.ownerChat, {
    cascade: true,
  })
  shops?: ShopEntity[];
}
