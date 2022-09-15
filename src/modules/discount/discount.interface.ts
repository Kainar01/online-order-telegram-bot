export interface Discount {
  id: number;
  title: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscountItemGroup {
  id: number;
  discountId: number;
  itemGroupId: number;
}

export interface CreateDiscountDto extends Omit<Discount, 'id' | 'createdAt' | 'updatedAt'> {
  itemGroupIds: number[];
}
