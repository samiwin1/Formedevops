import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';



import { AdminApi, AdminUser } from '../../../core/services/admin.api';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css',
})
export class UserManagementComponent implements OnInit {
  private api = inject(AdminApi);

  loading = false;
  error: string | null = null;

  // all normal users (admins filtered out)
  users: AdminUser[] = [];

  qCtrl = new FormControl<string>('', { nonNullable: true });

  ngOnInit(): void {
    this.refresh();
  }

  refresh() {
    this.loading = true;
    this.error = null;

    // we reuse list() and filter client-side
    this.api.list().subscribe({
      next: (res) => {
        const all = res ?? [];
        this.users = all.filter(u => !this.isAdmin(u));
        this.loading = false;
      },
      error: (e) => {
        this.error = e?.error?.message ?? 'Failed to load users';
        this.loading = false;
      }
    });
  }

  // ✅ Detect admin in multiple backend shapes
  private isAdmin(u: any): boolean {
    const role = (u?.role ?? '').toString().toUpperCase();
    const profession = (u?.profession ?? '').toString().toUpperCase();

    const rolesArr: string[] = Array.isArray(u?.roles)
      ? u.roles.map((x: any) => String(x).toUpperCase())
      : [];

    return (
      role.includes('ADMIN') ||
      profession === 'ADMIN' ||
      rolesArr.some(r => r.includes('ADMIN'))
    );
  }

  get filtered(): AdminUser[] {
    const q = this.qCtrl.value.trim().toLowerCase();
    if (!q) return this.users;

    return this.users.filter(u => {
      const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.toLowerCase();
      const email = (u.email ?? '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }
downloadPdf() {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  doc.setFontSize(14);
  doc.text('User Management - Normal Users', 14, 14);

  const rows = this.filtered.map(u => [
    `${u.firstName} ${u.lastName}`,
    u.email,
    String(u.profession ?? ''),
    ((u.active === false) || (u.isActive === false)) ? 'Disabled' : 'Active',
  ]);

  autoTable(doc, {
    head: [['Name', 'Email', 'Profession', 'Status']],
    body: rows,
    startY: 20,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [17, 24, 39] },
    margin: { left: 14, right: 14 },
  });

  doc.save('users.pdf');
}
}