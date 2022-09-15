export interface PurchaseItem {
  id: number;
  price: number;
  unitPrice: number;
  discountAmount: number;
  quantity: number;
  itemId: number;
  purchaseId: number;
}

export interface CreatePurchaseItemDto extends Omit<PurchaseItem, 'id' | 'createdAt' | 'updatedAt'> {}
