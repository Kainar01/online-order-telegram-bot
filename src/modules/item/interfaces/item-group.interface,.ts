export interface ItemGroup {
  id: number;
  title: string;
  shopId: number;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateItemGroupDto {
  title: string;
  shopId: number;
}

export interface CreateItemGroupRO extends Pick<ItemGroup, 'id' | 'title' | 'shopId'> {
  inserted: boolean;
}
