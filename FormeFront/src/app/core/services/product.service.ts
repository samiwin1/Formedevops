import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/environment';
import { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly baseApi = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  listProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseApi}/products`);
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.baseApi}/products/${id}`);
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(`${this.baseApi}/products`, product);
  }

  updateProduct(id: number, product: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.baseApi}/products/${id}`, product);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseApi}/products/${id}`);
  }

  toggleAvailability(id: number, isAvailable: boolean): Observable<Product> {
    return this.http.patch<Product>(`${this.baseApi}/products/${id}/availability`, { isAvailable });
  }
}
