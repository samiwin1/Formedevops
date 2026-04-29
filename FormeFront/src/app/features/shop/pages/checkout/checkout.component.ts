import { Component, OnInit, OnDestroy, inject, signal, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../../../enviroments/environment';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css',
})
export class CheckoutComponent implements OnInit, AfterViewInit, OnDestroy {
  private router = inject(Router);

  clientSecret = signal<string | null>(null);
  orderId = signal<number | null>(null);
  error = signal<string | null>(null);
  loading = signal(true);
  submitting = signal(false);

  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;

  ngOnInit(): void {
    const nav = this.router.getCurrentNavigation();
    const state = (nav?.extras?.state ?? this.router.lastSuccessfulNavigation?.extras?.state) as
      | { clientSecret?: string; orderId?: number }
      | undefined;
    const secret = state?.clientSecret ?? null;
    const oid = state?.orderId ?? null;
    if (secret && oid != null) {
      this.clientSecret.set(secret);
      this.orderId.set(oid);
    } else {
      this.error.set('Missing payment session. Please go back to cart and try again.');
      this.loading.set(false);
    }
  }

  ngAfterViewInit(): void {
    const secret = this.clientSecret();
    const oid = this.orderId();
    if (secret && oid != null) {
      this.initStripe(secret);
    }
  }

  ngOnDestroy(): void {
    this.elements = null;
    this.stripe = null;
  }

  private async initStripe(clientSecret: string): Promise<void> {
    const pk = environment.stripePublishableKey;
    const isPlaceholder = !pk || pk.includes('placeholder') || !pk.startsWith('pk_');
    if (isPlaceholder) {
      this.error.set(
        'Stripe is not configured. Open src/enviroments/environment.ts and set stripePublishableKey to your key from https://dashboard.stripe.com/apikeys (use the Publishable key, e.g. pk_test_...).'
      );
      this.loading.set(false);
      return;
    }
    try {
      this.stripe = await loadStripe(pk);
      if (!this.stripe) {
        this.error.set('Failed to load Stripe.');
        this.loading.set(false);
        return;
      }
      this.elements = this.stripe.elements({ clientSecret });
      const paymentElement = this.elements.create('payment');
      this.loading.set(false);
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      const container = document.getElementById('payment-element');
      if (container) {
        await paymentElement.mount(container);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to initialize payment form.';
      if (msg.includes('Could not retrieve data from Elements') || msg.includes('Elements')) {
        this.error.set(
          'Payment session invalid or expired. The Stripe publishable key (frontend) and secret key (backend) must be from the same Stripe account. Go back to cart and try again.'
        );
      } else {
        this.error.set(msg);
      }
      this.loading.set(false);
    }
  }

  async submit(): Promise<void> {
    if (!this.stripe || !this.elements) return;
    const oid = this.orderId();
    if (oid == null) return;
    this.submitting.set(true);
    this.error.set(null);
    const returnUrl = `${window.location.origin}/order/confirmation/${oid}`;
    const { error } = await this.stripe.confirmPayment({
      elements: this.elements,
      confirmParams: { return_url: returnUrl },
    });
    this.submitting.set(false);
    if (error) {
      this.error.set(error.message ?? 'Payment failed.');
    }
  }
}
