import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../enviroments/environment';
import { Order, OrderItem } from '../models/shop.models';

@Injectable({ providedIn: 'root' })
export class AdminOrderService {
  private readonly baseUrl = environment.shopApiUrl;

  constructor(private http: HttpClient) {}

  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}/order/listOrders`);
  }

  getOrder(orderId: number): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/order/getOrder/${orderId}`);
  }

  deleteOrder(orderId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/order/deleteOrder/${orderId}`);
  }

  getOrderItemsByOrderId(orderId: number): Observable<OrderItem[]> {
    return this.http.get<OrderItem[]>(`${this.baseUrl}/orderItem/getByOrderId/${orderId}`);
  }

  getAllOrderItems(): Observable<OrderItem[]> {
    return this.http.get<OrderItem[]>(`${this.baseUrl}/orderItem/listOrderItems`);
  }
}
