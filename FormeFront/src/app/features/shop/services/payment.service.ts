import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../enviroments/environment';
import { CreatePaymentIntentResponse } from '../models/shop.models';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly baseUrl = environment.paymentApiUrl;

  constructor(private http: HttpClient) {}

  createPaymentIntent(orderId: number): Observable<CreatePaymentIntentResponse> {
    return this.http.post<CreatePaymentIntentResponse>(`${this.baseUrl}/create-intent`, {
      orderId,
    });
  }
}
