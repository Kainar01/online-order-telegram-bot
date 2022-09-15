import type { ItemWithQuantity } from '@/modules/item/interfaces/item.interface';

export interface Purchase {
  id: number;
  total: number;
  discountId: number | null;
  discountAmount: number;
  status: PurchaseStatus;
  chatId: number | null;
  shopId: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum PurchaseStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELED = 'canceled',
}

export interface CreatePurchaseDto
  extends Omit<Purchase, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'discountAmount'>,
  Partial<Pick<Purchase, 'status' | 'discountAmount'>> {}

export interface UpdatePurchaseDto extends Partial<Omit<Purchase, 'id' | 'createdAt' | 'updatedAt'>> {}

export interface UpdatePurchaseRO
  extends Pick<Purchase, 'id' | 'discountAmount' | 'total' | 'chatId' | 'shopId' | 'status' | 'createdAt' | 'updatedAt'> {}

export interface MakePurchaseDto {
  total: number;
  discountId: number | null;
  items: ItemWithQuantity[];
}
