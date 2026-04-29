import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormationService } from '../../../../formation/services/formation.service';
import { ProductService } from '../../../services/product.service';
import { Formation } from '../../../../formation/models/formation.models';

@Component({
  selector: 'app-product-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './product-create.component.html',
  styleUrl: './product-create.component.css',
})
export class ProductCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private formationService = inject(FormationService);
  private productService = inject(ProductService);
  private router = inject(Router);

  formations: Formation[] = [];
  /** Formation IDs that already have a product (to disable in dropdown) */
  formationIdsWithProduct = new Set<number>();
  loading = true;
  submitting = false;
  error: string | null = null;

  form = this.fb.group({
    formationId: [null as number | null, [Validators.required]],
    price: [0, [Validators.required, Validators.min(1)]],
    currency: ['TND', [Validators.required]],
    isAvailable: [true],
  });

  ngOnInit(): void {
    this.loading = true;
    this.productService.listProducts().subscribe({
      next: (products) => {
        const ids = new Set<number>();
        (products ?? []).forEach((p) => {
          if (p.formationId != null) ids.add(p.formationId);
        });
        this.formationIdsWithProduct = ids;
        this.formationService.getAll().subscribe({
          next: (list) => {
            this.formations = (list ?? []).filter((f) => f.id != null);
            this.loading = false;
          },
          error: () => {
            this.loading = false;
          },
        });
      },
      error: () => {
        this.formationService.getAll().subscribe({
          next: (list) => {
            this.formations = (list ?? []).filter((f) => f.id != null);
            this.loading = false;
          },
          error: () => {
            this.loading = false;
          },
        });
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const formationId = v.formationId ?? 0;
    if (formationId <= 0) return;
    if (this.formationIdsWithProduct.has(formationId)) {
      this.error = 'This formation already has a product. Please choose another formation or edit the existing one from the product list.';
      return;
    }
    this.submitting = true;
    this.error = null;
    this.productService
      .addProduct({
        formationId,
        price: v.price ?? 0,
        currency: v.currency ?? 'TND',
        isAvailable: v.isAvailable ?? true,
      })
      .subscribe({
        next: () => {
          this.router.navigate(['/admin/products/list']);
        },
        error: (err) => {
          if (err?.status === 503) {
            this.error = 'Shop service unavailable. Start API Gateway (8082), Eureka (8761), and Shop Service (8084), then try again.';
          } else {
            const msg = err?.error?.message ?? err?.error ?? err?.message ?? 'Failed to create product';
            const isDuplicate = typeof msg === 'string' && (msg.includes('Duplicate entry') || msg.includes('UKIv1sbpp6xcb68kt2luxgo4cut') || msg.includes('constraint'));
            this.error = isDuplicate
              ? 'This formation already has a product. Please choose another formation or edit the existing product from the product list.'
              : msg;
          }
          this.submitting = false;
        },
      });
  }
}
