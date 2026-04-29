export interface OrderItem {
  idOrderItem?: number;
  order?: { idOrder: number };
  product?: { idProduct: number };
  formation?: { id: number };
  quantity: number;
  unitPriceSnapshot: number;
  formationTitleSnapshot: string;
}

export interface Order {
  idOrder?: number;
  userId: number;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt?: string;
  updatedAt?: string;
}
