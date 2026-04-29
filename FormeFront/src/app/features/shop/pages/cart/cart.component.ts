import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { PaymentService } from '../../services/payment.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Cart, CartItem } from '../../models/shop.models';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
})
export class CartComponent implements OnInit {
  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private paymentService = inject(PaymentService);
  private authService = inject(AuthService);
  private router = inject(Router);

  cart: Cart | null = null;
  items: CartItem[] = [];
  loading = true;
  error: string | null = null;
  checkoutLoading = false;
  removingId: number | null = null;

  ngOnInit(): void {
    const userId = this.authService.getUserId();
    if (userId == null) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/cart' } });
      return;
    }
    this.loadCart(userId);
  }

  loadCart(userId: number): void {
    this.loading = true;
    this.error = null;
    this.cartService.getActiveCartByUser(userId).subscribe({
      next: (cart) => {
        this.cart = cart ?? null;
        if (cart?.idCart != null) {
          this.cartService.getCartItemsByCartId(cart.idCart).subscribe({
            next: (list) => {
              this.items = list ?? [];
              this.loading = false;
            },
            error: () => {
              this.loading = false;
            },
          });
        } else {
          this.items = [];
          this.loading = false;
        }
      },
      error: () => {
        this.items = [];
        this.loading = false;
      },
    });
  }

  get total(): number {
    return this.items.reduce((sum, i) => sum + (i.unitPriceSnapshot ?? 0) * (i.quantity ?? 0), 0);
  }

  removeItem(item: CartItem): void {
    if (item.idCartItem == null) return;
    this.removingId = item.idCartItem;
    this.cartService.deleteCartItem(item.idCartItem).subscribe({
      next: () => {
        this.items = this.items.filter((i) => i.idCartItem !== item.idCartItem);
        const userId = this.authService.getUserId();
        if (userId != null) this.cartService.refreshCartCount(userId);
        this.removingId = null;
      },
      error: () => {
        this.removingId = null;
      },
    });
  }

  proceedToCheckout(): void {
    const userId = this.authService.getUserId();
    if (userId == null || this.items.length === 0) return;
    this.checkoutLoading = true;
    this.orderService.checkout(userId).subscribe({
      next: (order) => {
        if (order.idOrder == null) {
          this.checkoutLoading = false;
          return;
        }
        this.paymentService.createPaymentIntent(order.idOrder).subscribe({
          next: (res) => {
            this.checkoutLoading = false;
            this.error = null;
            this.router.navigate(['/checkout'], {
              state: { clientSecret: res.clientSecret, orderId: order.idOrder },
            });
          },
          error: (err) => {
            this.checkoutLoading = false;
            this.error = err?.error?.error || err?.message || 'Could not start payment. Check that the shop backend is running and Stripe keys match.';
          },
        });
      },
      error: (err) => {
        this.checkoutLoading = false;
        this.error = err?.error?.message || err?.message || 'Checkout failed.';
      },
    });
  }
}
