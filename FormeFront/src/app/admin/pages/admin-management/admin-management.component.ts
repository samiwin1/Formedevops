import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { interval, Subscription } from 'rxjs';

import { HeaderComponent } from '../../components/header/header.component';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { AdminApi, AdminUser, Profession } from '../../../core/services/admin.api';

type StatusFilter = 'ALL' | 'ACTIVE' | 'DISABLED';
type SortKey =
  | 'name_asc' | 'name_desc'
  | 'email_asc' | 'email_desc'
  | 'profession_asc' | 'profession_desc'
  | 'status_asc' | 'status_desc';

@Component({
  selector: 'app-admin-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HeaderComponent,
    NavbarComponent,
    
  ],
  templateUrl: './admin-management.component.html',
  styleUrl: './admin-management.component.css',
})
export class AdminManagementComponent implements OnInit, AfterViewInit, OnDestroy {

  private fb = inject(FormBuilder);
  private api = inject(AdminApi);

  private autoRefreshSub?: Subscription;

  loading = false;
  saving = false;
  disabling = false;
  error: string | null = null;

  admins: AdminUser[] = [];
  professions: Profession[] = ['STUDENT', 'DEVELOPER', 'OTHER', 'EVALUATOR', 'UNKNOWN'];

  // Filters
  qCtrl = new FormControl<string>('', { nonNullable: true });
  professionCtrl = new FormControl<string>('ALL', { nonNullable: true });
  statusCtrl = new FormControl<StatusFilter>('ALL', { nonNullable: true });
  sortCtrl = new FormControl<SortKey>('name_asc', { nonNullable: true });

  pageSizeCtrl = new FormControl<number>(10, { nonNullable: true });
  page = 1;

  toast: string | null = null;

  confirmOpen = false;
  selected: AdminUser | null = null;

  form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    profession: ['STUDENT' as Profession, [Validators.required]],
  });

  // ===============================
  // INIT
  // ===============================

  ngOnInit(): void {
    this.refresh();

    // AUTO REFRESH every 15 seconds
    this.autoRefreshSub = interval(15000).subscribe(() => {
      if (!this.loading && !this.saving && !this.disabling) {
        this.refresh();
      }
    });

    // Reset page when filters change
    const reset = () => (this.page = 1);
    this.qCtrl.valueChanges.subscribe(reset);
    this.professionCtrl.valueChanges.subscribe(reset);
    this.statusCtrl.valueChanges.subscribe(reset);
    this.sortCtrl.valueChanges.subscribe(reset);
    this.pageSizeCtrl.valueChanges.subscribe(reset);
  }

  ngAfterViewInit(): void {
    // Only load moment; jQuery is already global from angular.json.
    // Skip apexcharts and dashboard-init to avoid "Element not found" when chart containers are missing.
    setTimeout(() => {
      const scriptSrc = 'assets/duralux/vendors/js/moment.min.js';
      if (document.querySelector(`script[src*="moment.min.js"]`)) return;
      const script = document.createElement('script');
      script.src = scriptSrc;
      script.onload = () => {};
      script.onerror = () => {};
      document.body.appendChild(script);
    }, 300);
  }

  ngOnDestroy(): void {
    this.autoRefreshSub?.unsubscribe();
  }

  // ===============================
  // API
  // ===============================

  refresh() {
    this.loading = true;
    this.error = null;

    this.api.list().subscribe({
      next: (res) => {
        this.admins = res ?? [];
        this.loading = false;
      },
      error: (e) => {
        this.error = e?.error?.message ?? 'Failed to load admins';
        this.loading = false;
      },
    });
  }

  create() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = null;

    const v = this.form.value;

    this.api.create({
      firstName: v.firstName!,
      lastName: v.lastName!,
      email: v.email!,
      password: v.password!,
      profession: v.profession!,
    }).subscribe({
      next: () => {
        this.saving = false;
        this.form.reset({ profession: 'STUDENT' as Profession });
        this.refresh();
      },
      error: (e) => {
        this.error = e?.error?.message ?? 'Create admin failed';
        this.saving = false;
      },
    });
  }

  // ===============================
  // EXPORT PDF
  // ===============================

  exportPdf(): void {
    const data = this.filtered;
    const now = new Date().toLocaleString();

    // Build the HTML for the print window
    const rows = data.map(a => `
      <tr>
        <td>${a.firstName ?? ''} ${a.lastName ?? ''}</td>
        <td>${a.email ?? ''}</td>
        <td>${a.profession ?? ''}</td>
        <td>${this.isActive(a) ? 'Active' : 'Disabled'}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Admin List — ForMe</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 32px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
          .header h1 { font-size: 22px; font-weight: 700; color: #111827; }
          .header p  { font-size: 12px; color: #6b7280; margin-top: 4px; }
          .meta { text-align: right; font-size: 12px; color: #6b7280; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          thead tr { background: #1a56db; color: #fff; }
          thead th { padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 600; letter-spacing: .4px; }
          tbody tr:nth-child(even) { background: #f9fafb; }
          tbody tr:hover { background: #eff6ff; }
          tbody td { padding: 9px 14px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
          .badge-active   { background:#dcfce7; color:#166534; padding:2px 8px; border-radius:99px; font-size:11px; font-weight:600; }
          .badge-disabled { background:#fee2e2; color:#991b1b; padding:2px 8px; border-radius:99px; font-size:11px; font-weight:600; }
          .footer { margin-top: 24px; font-size: 11px; color: #9ca3af; text-align: center; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Admin Management — ForMe</h1>
            <p>Exported on ${now}</p>
          </div>
          <div class="meta">
            <div>Total admins: <strong>${data.length}</strong></div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Profession</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(a => `
              <tr>
                <td>${a.firstName ?? ''} ${a.lastName ?? ''}</td>
                <td>${a.email ?? ''}</td>
                <td>${a.profession ?? ''}</td>
                <td>
                  <span class="${this.isActive(a) ? 'badge-active' : 'badge-disabled'}">
                    ${this.isActive(a) ? 'Active' : 'Disabled'}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">ForMe Admin Dashboard &nbsp;·&nbsp; ${now}</div>
      </body>
      </html>
    `;

    // Open print preview in a new window
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) {
      this.error = 'Popup blocked — please allow popups for this site.';
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  }

  // ===============================
  // FILTERING & PAGINATION
  // ===============================

  get filtered(): AdminUser[] {
    const q = this.qCtrl.value.trim().toLowerCase();
    const prof = this.professionCtrl.value;
    const status = this.statusCtrl.value;

    let out = [...this.admins];

    if (q) {
      out = out.filter(a => {
        const name = `${a.firstName ?? ''} ${a.lastName ?? ''}`.toLowerCase();
        const email = (a.email ?? '').toLowerCase();
        return name.includes(q) || email.includes(q);
      });
    }

    if (prof !== 'ALL') out = out.filter(a => a.profession === prof);

    if (status !== 'ALL') {
      out = out.filter(a =>
        status === 'ACTIVE' ? this.isActive(a) : !this.isActive(a)
      );
    }

    out.sort((a, b) => this.compare(a, b, this.sortCtrl.value));
    return out;
  }

  get totalPages(): number {
    const size = this.pageSizeCtrl.value;
    return Math.max(1, Math.ceil(this.filtered.length / size));
  }

  get paged(): AdminUser[] {
    const size = this.pageSizeCtrl.value;
    const start = (this.page - 1) * size;
    return this.filtered.slice(start, start + size);
  }

  prev() { this.page = Math.max(1, this.page - 1); }
  next() { this.page = Math.min(this.totalPages, this.page + 1); }

  // ===============================
  // HELPERS
  // ===============================

  private compare(a: AdminUser, b: AdminUser, key: SortKey): number {
    const nameA = `${a.firstName ?? ''} ${a.lastName ?? ''}`.toLowerCase();
    const nameB = `${b.firstName ?? ''} ${b.lastName ?? ''}`.toLowerCase();
    const emailA = (a.email ?? '').toLowerCase();
    const emailB = (b.email ?? '').toLowerCase();
    const profA = (a.profession ?? '').toLowerCase();
    const profB = (b.profession ?? '').toLowerCase();
    const stA = this.isActive(a) ? 0 : 1;
    const stB = this.isActive(b) ? 0 : 1;

    const cmp = (x: string, y: string) => x.localeCompare(y);
    const cmpNum = (x: number, y: number) => x - y;

    switch (key) {
      case 'name_asc': return cmp(nameA, nameB);
      case 'name_desc': return cmp(nameB, nameA);
      case 'email_asc': return cmp(emailA, emailB);
      case 'email_desc': return cmp(emailB, emailA);
      case 'profession_asc': return cmp(profA, profB);
      case 'profession_desc': return cmp(profB, profA);
      case 'status_asc': return cmpNum(stA, stB);
      case 'status_desc': return cmpNum(stB, stA);
    }
  }

  openDisable(u: AdminUser) {
    this.selected = u;
    this.confirmOpen = true;
  }

  closeConfirm() {
    this.confirmOpen = false;
    this.selected = null;
  }

  confirmDisable() {
    if (!this.selected) return;

    this.disabling = true;
    this.error = null;

    this.api.disable(this.selected.id).subscribe({
      next: () => {
        this.disabling = false;
        this.closeConfirm();
        this.refresh();
      },
      error: (e) => {
        this.disabling = false;
        this.error = e?.error?.message ?? 'Disable failed';
      },
    });
  }

  isActive(u: AdminUser) {
    const val = (u as any).active ?? (u as any).isActive;
    return val !== false;
  }

  initials(u: AdminUser) {
    const a = (u.firstName?.[0] ?? 'A').toUpperCase();
    const b = (u.lastName?.[0] ?? 'D').toUpperCase();
    return `${a}${b}`;
  }

  async copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      this.toast = text;
      setTimeout(() => {
        if (this.toast === text) this.toast = null;
      }, 900);
    } catch {
      this.error = 'Clipboard not allowed (try HTTPS or localhost).';
    }
  }
}