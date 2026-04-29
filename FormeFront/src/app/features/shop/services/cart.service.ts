import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../../enviroments/environment';
import { Cart, CartItem } from '../models/shop.models';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly baseUrl = environment.shopApiUrl;
  private cartCountSubject = new BehaviorSubject<number>(0);
  cartCount$ = this.cartCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  getActiveCartByUser(userId: number): Observable<Cart | null> {
    return this.http.get<Cart>(`${this.baseUrl}/cart/getActiveCartByUser/${userId}`).pipe(
      catchError(() => of(null))
    );
  }

  addCart(cart: { userId: number; status?: string }): Observable<Cart> {
    return this.http.post<Cart>(`${this.baseUrl}/cart/addCart`, {
      userId: cart.userId,
      status: cart.status ?? 'ACTIVE',
    });
  }

  addCartItem(cartItem: {
    cart: { idCart: number };
    product: { idProduct: number };
    quantity: number;
    unitPriceSnapshot: number;
    formationId: number;
    formationTitleSnapshot: string;
  }): Observable<CartItem> {
    return this.http.post<CartItem>(`${this.baseUrl}/cartItem/addCartItem`, cartItem);
  }

  updateCartItem(id: number, cartItem: Partial<CartItem>): Observable<CartItem> {
    return this.http.put<CartItem>(`${this.baseUrl}/cartItem/updateCartItem/${id}`, {
      idCartItem: id,
      ...cartItem,
    });
  }

  deleteCartItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/cartItem/deleteCartItem/${id}`);
  }

  getCartItemsByCartId(cartId: number): Observable<CartItem[]> {
    return this.http.get<CartItem[]>(`${this.baseUrl}/cartItem/getByCartId/${cartId}`);
  }

  getCartItemByCartIdAndProductId(cartId: number, productId: number): Observable<CartItem | null> {
    return this.http
      .get<CartItem>(`${this.baseUrl}/cartItem/getByCartIdAndProductId/${cartId}/${productId}`)
      .pipe(catchError(() => of(null)));
  }

  refreshCartCount(userId: number): void {
    this.getActiveCartByUser(userId)
      .pipe(
        switchMap((cart) => {
          if (cart?.idCart == null) return of(0);
          return this.getCartItemsByCartId(cart.idCart).pipe(
            map((items) => items.reduce((sum, i) => sum + (i.quantity ?? 0), 0)),
            catchError(() => of(0))
          );
        }),
        catchError(() => of(0))
      )
      .subscribe((count) => this.cartCountSubject.next(count));
  }
}
