export interface Shop {
  id: number;
  title: string;
  ownerChatId: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateShopDto extends Omit<Shop, 'id' | 'createdAt' | 'updatedAt' | 'isPublished'> {}

export interface CreateShopRO extends Pick<Shop, 'id' | 'ownerChatId' | 'title'> {
  inserted: boolean;
}

export interface UpdateShopDto extends Partial<Omit<Shop, 'id' | 'createdAt' | 'updatedAt'>> {}

export interface UpdateShopRO extends Pick<Shop, 'id' | 'title' | 'ownerChatId' | 'isPublished' | 'createdAt' | 'updatedAt'> {}
