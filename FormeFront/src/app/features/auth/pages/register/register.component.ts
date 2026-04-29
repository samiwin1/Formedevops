import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, NgZone } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

type Profession = 'STUDENT' | 'DEVELOPER' | 'OTHER' | 'UNKNOWN' | 'EVALUATOR';

declare global {
  interface Window {
    grecaptcha: any;
  }
}

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['../../../../auth.styles.css'],
})
export class RegisterComponent implements OnInit {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  loading      = false;
  error: string | null = null;
  showPassword = false;
  captchaToken: string | null = null;
  captchaError = false;

  // ✅ Your real reCAPTCHA v2 Site Key
  siteKey = '6Ldiv34sAAAAAOiE0cF5eyFjkos3b_1j4RAvK9r6';

  professionOptions: Array<{ value: Profession; label: string }> = [
    { value: 'STUDENT',   label: 'Student' },
    { value: 'DEVELOPER', label: 'Developer' },
    { value: 'OTHER',     label: 'Other' },
    { value: 'EVALUATOR', label: 'Evaluator' },
    { value: 'UNKNOWN',   label: 'Prefer not to say' },
  ];

  form = this.fb.group({
    firstName:   ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    lastName:    ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    email:       ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    password:    ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    profession:  ['STUDENT' as Profession, [Validators.required]],
    partnerID:   [null as number | null],
    partnerCode: [''],
  });

  get f() {
    return this.form.controls;
  }

  ngOnInit(): void {
    this.renderRecaptcha();
  }

  renderRecaptcha(): void {
    const tryRender = () => {
      if (typeof window.grecaptcha !== 'undefined' && window.grecaptcha.render) {
        this.ngZone.runOutsideAngular(() => {
          window.grecaptcha.render('recaptcha-container', {
            sitekey: this.siteKey,
            callback: (token: string) => {
              this.ngZone.run(() => {
                this.captchaToken = token;
                this.captchaError = false;
              });
            },
            'expired-callback': () => {
              this.ngZone.run(() => {
                this.captchaToken = null;
              });
            },
          });
        });
      } else {
        setTimeout(tryRender, 300);
      }
    };
    tryRender();
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Block submission if CAPTCHA not completed
    if (!this.captchaToken) {
      this.captchaError = true;
      return;
    }

    this.loading = true;
    this.error   = null;
    this.captchaError = false;

    const v = this.form.value;

    this.auth.register({
      firstName:    v.firstName!,
      lastName:     v.lastName!,
      email:        v.email!,
      password:     v.password!,
      profession:   v.profession! as Profession,
      partnerID:    v.partnerID ?? null,
      partnerCode:  (v.partnerCode ?? '').trim() || null,
      captchaToken: this.captchaToken,
    }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/login']);
      },
      error: (e) => {
        this.loading = false;
        this.error =
          e?.error?.message ||
          e?.error?.error ||
          'Registration failed';

        // Reset captcha so user must re-verify
        if (typeof window.grecaptcha !== 'undefined') {
          window.grecaptcha.reset();
        }
        this.captchaToken = null;
      },
    });
  }
}