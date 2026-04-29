import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../enviroments/environment';
import { Order } from '../models/shop.models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly baseUrl = environment.shopApiUrl;

  constructor(private http: HttpClient) {}

  checkout(userId: number): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/order/checkout/${userId}`, {});
  }

  getOrder(orderId: number): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/order/getOrder/${orderId}`);
  }

  updateOrderStatus(orderId: number, status: string): Observable<Order> {
    return this.http.put<Order>(`${this.baseUrl}/order/updateOrderStatus/${orderId}`, { status });
  }
}
