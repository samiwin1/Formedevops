import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/environment';
import { Order, OrderItem } from '../models/order.model';

export interface ProductStatistic {
  productId: number;
  formationTitle: string;
  totalSold: number;
  totalRevenue: number;
}

@Injectable({ providedIn: 'root' })
export class AdminOrderService {
  private readonly baseApi = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseApi}/admin/orders`);
  }

  getAllOrderItems(): Observable<OrderItem[]> {
    return this.http.get<OrderItem[]>(`${this.baseApi}/admin/order-items`);
  }

  getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.baseApi}/admin/orders/${id}`);
  }

  getProductStatistics(): Observable<ProductStatistic[]> {
    return this.http.get<ProductStatistic[]>(`${this.baseApi}/admin/orders/statistics/products`);
  }

  updateOrderStatus(id: number, status: string): Observable<Order> {
    return this.http.patch<Order>(`${this.baseApi}/admin/orders/${id}/status`, { status });
  }
}
