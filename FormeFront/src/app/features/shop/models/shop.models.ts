export interface Product {
  idProduct?: number;
  formationId: number;
  formationTitleSnapshot?: string;
  price: number;
  currency: string;
  isAvailable?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Cart {
  idCart?: number;
  userId: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  idCartItem?: number;
  cart: { idCart: number };
  product: { idProduct: number };
  formationId?: number;
  quantity: number;
  unitPriceSnapshot?: number;
  formationTitleSnapshot?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  idOrder?: number;
  userId: number;
  status: string;
  totalAmount: number;
  currency?: string;
  orderItems?: OrderItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  idOrderItem?: number;
  order?: Order;
  product?: Product;
  formationId: number;
  quantity: number;
  unitPriceSnapshot: number;
  formationTitleSnapshot: string;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}
