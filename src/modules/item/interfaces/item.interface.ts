export interface Item {
  id: number;
  title: string;
  imageId: string | null;
  itemGroupId: number;
  price: number;
  unitPrice: number;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateItemDto extends Omit<Item, 'id' | 'createdAt' | 'updatedAt'> {}

export interface UpdateItemDto extends Partial<Omit<Item, 'id' | 'createdAt' | 'updatedAt'>> {}

export interface UpdateItemRO
  extends Pick<Item, 'id' | 'title' | 'itemGroupId' | 'price' | 'quantity' | 'imageId' | 'createdAt' | 'updatedAt'> {}

export interface ItemToPurchase extends Pick<Item, 'id' | 'price' | 'title' | 'unitPrice'> {
  discountAmount: number;
  discountPercentage: number;
  outOfStock: boolean;
}

export interface ItemToPurchaseWithQuantity extends ItemToPurchase {
  quantity: number;
}

export interface ItemWithQuantity {
  id: number;
  quantity: number;
}

export interface PurchaseTotals {
  total: number;
  discountAmount: number;
}
