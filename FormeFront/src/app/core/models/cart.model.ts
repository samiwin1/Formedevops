export interface CartItem {
  idCartItem?: number;
  cart?: { idCart: number };
  product?: { idProduct: number };
  formation?: { id: number };
  quantity: number;
  unitPriceSnapshot: number;
  formationTitleSnapshot: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Cart {
  idCart?: number;
  userId: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}
