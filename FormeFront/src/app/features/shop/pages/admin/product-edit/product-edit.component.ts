import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormationService } from '../../../../formation/services/formation.service';
import { ProductService } from '../../../services/product.service';
import { Formation } from '../../../../formation/models/formation.models';

@Component({
  selector: 'app-product-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './product-edit.component.html',
  styleUrl: './product-edit.component.css',
})
export class ProductEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private formationService = inject(FormationService);
  private productService = inject(ProductService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  formations: Formation[] = [];
  loading = true;
  submitting = false;
  error: string | null = null;
  productId: number | null = null;

  form = this.fb.group({
    formationId: [null as number | null, [Validators.required]],
    price: [0, [Validators.required, Validators.min(1)]],
    currency: ['TND', [Validators.required]],
    isAvailable: [true],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.productId = id ? +id : null;
    if (this.productId == null || isNaN(this.productId)) {
      this.router.navigate(['/admin/products/list']);
      return;
    }
    this.formationService.getAll().subscribe({
      next: (list) => {
        this.formations = (list ?? []).filter((f) => f.id != null);
      },
      error: () => {},
    });
    this.productService.getProduct(this.productId).subscribe({
      next: (product) => {
        this.form.patchValue({
          formationId: product.formationId,
          price: product.price,
          currency: product.currency ?? 'TND',
          isAvailable: product.isAvailable ?? true,
        });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  submit(): void {
    if (this.form.invalid || this.productId == null) return;
    const v = this.form.getRawValue();
    const formationId = v.formationId ?? 0;
    if (formationId <= 0) return;
    this.submitting = true;
    this.error = null;
    this.productService
      .updateProduct(this.productId, {
        formationId,
        formationTitleSnapshot: undefined,
        price: v.price ?? 0,
        currency: v.currency ?? 'TND',
        isAvailable: v.isAvailable ?? true,
      })
      .subscribe({
        next: () => {
          this.router.navigate(['/admin/products/list']);
        },
        error: (err) => {
          this.error = err.error?.message || err.message || 'Failed to update product';
          this.submitting = false;
        },
      });
  }
}
