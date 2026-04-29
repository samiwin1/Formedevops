import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../enviroments/environment';
import { Product } from '../models/shop.models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly baseUrl = environment.shopApiUrl;

  constructor(private http: HttpClient) {}

  listProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/product/listProducts`);
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/product/getProduct/${id}`);
  }

  addProduct(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(`${this.baseUrl}/product/addProduct`, {
      formationId: product.formationId,
      price: product.price,
      currency: product.currency,
      isAvailable: product.isAvailable ?? true,
    });
  }

  updateProduct(id: number, product: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/product/updateProduct/${id}`, {
      idProduct: id,
      formationId: product.formationId,
      formationTitleSnapshot: product.formationTitleSnapshot,
      price: product.price,
      currency: product.currency,
      isAvailable: product.isAvailable ?? true,
    });
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/product/deleteProduct/${id}`);
  }
}
