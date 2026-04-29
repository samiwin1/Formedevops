// src/app/features/auth/pages/login/login.component.ts
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../../features/shop/services/cart.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['../../../../auth.styles.css'],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private cartService = inject(CartService);
  private router = inject(Router);

  loading = false;
  error: string | null = null;
  showPassword = false;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    const payload = {
      email: this.form.value.email!,
      password: this.form.value.password!,
    };

    this.auth.login(payload).subscribe({
      next: () => {
        this.loading = false;
        const userId = this.auth.getUserId();
        if (userId != null) this.cartService.refreshCartCount(userId);
        const roles = this.auth.getRoles();
        console.log('Login successful. Roles:', roles);

        if (this.auth.isAdmin()) {
          console.log('Navigating to admin dashboard');
          this.router.navigate(['/admin/dashboard']);
        } else if (this.auth.isEvaluator()) {
          console.log('Navigating to evaluator oral assignments');
          this.router.navigate(['/evaluator/oral-assignments']);
        } else if (this.auth.isUser()) {
          console.log('Navigating to learner certification space');
          this.router.navigate(['/me/certification-space']);
        } else {
          console.log('Navigating to home');
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Login error details:', err);

        if (err?.message === 'NO_JWT_IN_RESPONSE') {
          this.error = 'Login failed: token missing in response (check backend response fields).';
          return;
        }

        // Try to get message from backend response
        const backendMessage = err.error?.message || err.error?.error || err.message;

        if (err.status === 401 || err.status === 403) {
          this.error = backendMessage || 'Invalid credentials';
        } else {
          this.error = backendMessage || 'An unexpected error occurred. Please try again later.';
        }
      },
    });
  }
}
