import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { Product } from '../../../models/shop.models';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css',
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);

  products: Product[] = [];
  loading = true;
  error: string | null = null;
  deletingId: number | null = null;
  searchTerm = '';
  deleteError: string | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.deleteError = null;
    this.productService.listProducts().subscribe({
      next: (list) => {
        this.products = list ?? [];
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || err.message || 'Failed to load products';
        this.loading = false;
      },
    });
  }

  get filteredProducts(): Product[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.products;
    }
    return this.products.filter((p) => {
      const title = (p.formationTitleSnapshot || '').toLowerCase();
      const id = (p.idProduct ?? '').toString();
      return title.includes(term) || id.includes(term);
    });
  }

  deleteProduct(product: Product): void {
    const id = product.idProduct;
    if (id == null) return;
    if (!confirm(`Delete product "${product.formationTitleSnapshot}"?`)) return;
    this.deletingId = id;
    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.products = this.products.filter((p) => p.idProduct !== id);
        this.deletingId = null;
      },
      error: (err) => {
        const msg = err?.error?.message ?? err?.error ?? err?.message ?? 'Failed to delete product';
        const isForeignKey = typeof msg === 'string' && (msg.includes('foreign key constraint') || msg.includes('order_item') || msg.includes('Cannot delete or update a parent row'));
        this.deleteError = isForeignKey
          ? 'This product can\'t be deleted because it has been used in orders. You can disable it instead (Edit → uncheck "Available") so it no longer appears for new purchases.'
          : msg;
        this.deletingId = null;
      },
    });
  }
}
