import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { PaymentService } from '../../services/payment.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { SafeResourceUrlPipe } from '../../../../core/pipes/safe-resource-url.pipe';
import { Product } from '../../models/shop.models';
import { DocumentService } from '../../../documents/services/document.service';
import { AdminDocument } from '../../../documents/models/document.models';

@Component({
  selector: 'app-courses-list',
  standalone: true,
  imports: [CommonModule, FormsModule, SafeResourceUrlPipe],
  templateUrl: './courses-list.component.html',
  styleUrl: './courses-list.component.css',
})
export class CoursesListComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private paymentService = inject(PaymentService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  products: Product[] = [];
  loading = true;
  error: string | null = null;
  addingProductId: number | null = null;
  buyingProductId: number | null = null;

  private documentService = inject(DocumentService);
  isDocsModalOpen = false;
  selectedDocs: AdminDocument[] = [];
  selectedDoc: AdminDocument | null = null;
  previewUrl: string | null = null;
  previewText: string | null = null;
  previewLoading = false;
  previewError: string | null = null;
  openingDocId: number | null = null;
  downloadingDocId: number | null = null;
  chatQuestion = '';
  chatLoading = false;
  chatMessages: Array<{ role: 'assistant' | 'user'; text: string }> = [];
  loadingDocs = false;
  openingDocsProductId: number | null = null;

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.error = null;
    this.productService.listProducts().subscribe({
      next: (list) => {
        this.products = list ?? [];
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || err.message || 'Failed to load courses';
        this.loading = false;
      },
    });
  }

  addToCart(product: Product): void {
    const userId = this.authService.getUserId();
    if (userId == null) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/cart' } });
      return;
    }
    if (product.idProduct == null) return;
    this.addingProductId = product.idProduct;
    this.ensureActiveCartThen(userId, (cartId) => {
      this.addOrIncrementCartItem(cartId, product, userId, {
        next: () => {
          this.toast.success('Course added to cart.');
          this.addingProductId = null;
        },
        error: (err) => {
          this.toast.error(this.errorMessage(err, 'Could not add this course to your cart.'));
          this.addingProductId = null;
        }
      });
    }, (msg) => {
      this.toast.error(msg);
      this.addingProductId = null;
    });
  }

  buyNow(product: Product): void {
    const userId = this.authService.getUserId();
    if (userId == null) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/courses' } });
      return;
    }
    if (product.idProduct == null) return;
    this.buyingProductId = product.idProduct;
    this.ensureActiveCartThen(userId, (cartId) => {
      this.addOrIncrementCartItem(cartId, product, userId, {
        next: () => {
          this.orderService.checkout(userId).subscribe({
            next: (order) => {
              if (order.idOrder == null) {
                this.toast.error('Order creation failed. Please try again.');
                this.buyingProductId = null;
                return;
              }
              this.paymentService.createPaymentIntent(order.idOrder).subscribe({
                next: (res) => {
                  this.buyingProductId = null;
                  this.router.navigate(['/checkout'], {
                    state: { clientSecret: res.clientSecret, orderId: order.idOrder },
                  });
                },
                error: (err) => {
                  this.toast.error(this.errorMessage(err, 'Could not initialize payment.'));
                  this.buyingProductId = null;
                },
              });
            },
            error: (err) => {
              this.toast.error(this.errorMessage(err, 'Checkout failed.'));
              this.buyingProductId = null;
            },
          });
        },
        error: (err) => {
          this.toast.error(this.errorMessage(err, 'Could not add this course to your cart.'));
          this.buyingProductId = null;
        }
      });
    }, (msg) => {
      this.toast.error(msg);
      this.buyingProductId = null;
    });
  }

  private addOrIncrementCartItem(
    cartId: number,
    product: Product,
    userId: number,
    handlers: { next: () => void; error: (err: unknown) => void }
  ): void {
    if (product.idProduct == null) {
      handlers.error('Invalid product');
      return;
    }

    this.cartService.getCartItemByCartIdAndProductId(cartId, product.idProduct).subscribe({
      next: (existing) => {
        if (existing?.idCartItem != null) {
          const qty = existing.quantity ?? 0;
          this.cartService.updateCartItem(existing.idCartItem, { quantity: qty + 1 }).subscribe({
            next: () => {
              this.cartService.refreshCartCount(userId);
              handlers.next();
            },
            error: handlers.error,
          });
          return;
        }

        this.cartService.addCartItem({
          cart: { idCart: cartId },
          product: { idProduct: product.idProduct! },
          quantity: 1,
          unitPriceSnapshot: product.price,
          formationId: product.formationId,
          formationTitleSnapshot: product.formationTitleSnapshot ?? '',
        }).subscribe({
          next: () => {
            this.cartService.refreshCartCount(userId);
            handlers.next();
          },
          error: handlers.error,
        });
      },
      error: handlers.error,
    });
  }

  private errorMessage(err: any, fallback: string): string {
    const msg = err?.error?.message ?? err?.error?.error ?? err?.error ?? err?.message ?? fallback;
    if (typeof msg !== 'string') return fallback;
    if (msg.includes('already exists for formation')) {
      return 'This formation already has a product. Use the existing one.';
    }
    if (msg.includes('Cart is empty')) {
      return 'Your cart is empty.';
    }
    return msg;
  }

  private ensureActiveCartThen(userId: number, fn: (cartId: number) => void, onError: (message: string) => void): void {
    this.cartService.getActiveCartByUser(userId).subscribe({
      next: (cart) => {
        if (cart?.idCart != null) {
          fn(cart.idCart);
          return;
        }
        this.cartService.addCart({ userId, status: 'ACTIVE' }).subscribe({
          next: (newCart) => {
            if (newCart?.idCart != null) {
              fn(newCart.idCart);
              return;
            }
            onError('Could not create a cart for your account.');
          },
          error: (err) => onError(this.errorMessage(err, 'Could not create a cart for your account.')),
        });
      },
      error: (err) => onError(this.errorMessage(err, 'Could not load your cart.')),
    });
  }

  openDocuments(product: Product): void {
    if (!product.formationId) return;
    this.openingDocsProductId = product.idProduct ?? null;
    this.isDocsModalOpen = true;
    this.loadingDocs = true;
    this.selectedDocs = [];
    this.selectedDoc = null;
    this.previewError = null;
    this.previewText = null;
    this.chatQuestion = '';
    this.chatMessages = [];
    this.revokePreviewUrl();

    this.documentService.getDocumentsByFormation(product.formationId).subscribe({
      next: (docs) => {
        this.selectedDocs = docs;
        this.loadingDocs = false;
        this.openingDocsProductId = null;
        if (this.selectedDocs.length > 0) {
          this.selectDocument(this.selectedDocs[0]);
        }
      },
      error: () => {
        this.loadingDocs = false;
        this.openingDocsProductId = null;
      }
    });
  }

  closeDocuments(): void {
    this.isDocsModalOpen = false;
    this.selectedDocs = [];
    this.selectedDoc = null;
    this.previewError = null;
    this.previewText = null;
    this.chatQuestion = '';
    this.chatMessages = [];
    this.chatLoading = false;
    this.previewLoading = false;
    this.revokePreviewUrl();
  }

  ngOnDestroy(): void {
    this.revokePreviewUrl();
  }

  selectDocument(doc: AdminDocument): void {
    if (!doc.id) {
      this.previewError = 'This document has no valid id.';
      return;
    }

    this.selectedDoc = doc;
    this.previewError = null;
    this.previewText = null;
    this.chatQuestion = '';
    this.chatMessages = [
      { role: 'assistant', text: 'Ask me anything about this document. I will answer from its content.' }
    ];

    if (!this.canInlinePreview(doc)) {
      this.revokePreviewUrl();
      this.previewLoading = true;
      this.documentService.getPreviewText(doc.id).subscribe({
        next: (text) => {
          this.previewText = text || 'No readable preview available.';
          this.previewLoading = false;
        },
        error: () => {
          this.previewLoading = false;
          this.previewError = 'Could not generate a readable preview. You can still open it in a new tab or download it.';
        },
      });
      return;
    }

    this.previewLoading = true;

    this.documentService.downloadFile(doc.id).subscribe({
      next: (blob) => {
        this.revokePreviewUrl();
        this.previewUrl = URL.createObjectURL(blob);
        this.previewLoading = false;
      },
      error: () => {
        this.previewLoading = false;
        this.previewError = 'Could not preview this file. You can still open it in a new tab or download it.';
      },
    });
  }

  openDocument(doc: AdminDocument): void {
    if (!doc.id) return;

    if (!this.canInlinePreview(doc)) {
      this.selectDocument(doc);
      return;
    }

    this.openingDocId = doc.id;
    this.documentService.downloadFile(doc.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener');
        this.openingDocId = null;
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: () => {
        this.openingDocId = null;
        this.toast.error('Could not open this document. Try downloading it instead.');
      },
    });
  }

  downloadDocument(doc: AdminDocument): void {
    if (!doc.id) return;
    this.downloadingDocId = doc.id;
    this.documentService.downloadFile(doc.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileName || 'document';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        this.downloadingDocId = null;
      },
      error: () => {
        this.downloadingDocId = null;
        this.toast.error('Could not download this document.');
      }
    });
  }

  askSelectedDocument(): void {
    const doc = this.selectedDoc;
    const question = this.chatQuestion.trim();
    if (!doc?.id || !question || this.chatLoading) return;

    this.chatMessages.push({ role: 'user', text: question });
    this.chatQuestion = '';
    this.chatLoading = true;

    this.documentService.askDocument(doc.id, question).subscribe({
      next: (res) => {
        const answer = res?.answer || 'I could not produce an answer right now.';
        this.chatMessages.push({ role: 'assistant', text: answer });
        this.chatLoading = false;
      },
      error: () => {
        this.chatMessages.push({ role: 'assistant', text: 'I could not answer right now. Please try again.' });
        this.chatLoading = false;
      }
    });
  }

  private revokePreviewUrl(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = null;
    }
  }

  displayFileType(doc: AdminDocument): string {
    const fileName = `${doc.fileName || doc.title || ''}`.toLowerCase();
    const raw = `${doc.fileType || ''}`.toUpperCase();

    if (fileName.endsWith('.pptx') || fileName.endsWith('.ppt')) return 'PPT';
    if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) return 'WORD';
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) return 'EXCEL';
    if (fileName.endsWith('.odt')) return 'ODT';
    if (fileName.endsWith('.ods')) return 'ODS';
    if (fileName.endsWith('.odp')) return 'ODP';
    if (fileName.endsWith('.pdf')) return 'PDF';
    if (/\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(fileName)) return 'IMAGE';
    if (/\.(mp4|avi|mov|mkv|webm)$/i.test(fileName)) return 'VIDEO';

    return raw || 'OTHER';
  }

  private canInlinePreview(doc: AdminDocument): boolean {
    const name = `${doc.fileName || doc.title || ''}`.toLowerCase();
    const type = `${doc.fileType || ''}`.toLowerCase();

    if (/\.(ppt|pptx|doc|docx|xls|xlsx|odt|ods|odp)$/.test(name)) {
      return false;
    }

    if (/\.(pdf)$/.test(name)) {
      return true;
    }

    if (/\.(png|jpg|jpeg|gif|webp|bmp|svg)$/.test(name)) {
      return true;
    }

    if (type === 'pdf') {
      return true;
    }

    return type === 'image';
  }
}
