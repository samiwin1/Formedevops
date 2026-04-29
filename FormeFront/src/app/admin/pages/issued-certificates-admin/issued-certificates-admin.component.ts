import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IssuedCertification } from '../../../core/models/certification.models';
import { IssuedCertificationService } from '../../../core/services/issued-certification.service';

@Component({
  standalone: true,
  selector: 'app-issued-certificates-admin',
  imports: [CommonModule, FormsModule],
  templateUrl: './issued-certificates-admin.component.html',
  styleUrl: './issued-certificates-admin.component.css',
})
export class IssuedCertificatesAdminComponent implements OnInit {
  private readonly issuedCertificationService = inject(IssuedCertificationService);

  list: IssuedCertification[] = [];
  loading = false;
  error: string | null = null;
  success: string | null = null;
  revokingId: number | null = null;
  statusFilter: 'ALL' | 'ISSUED' | 'REVOKED' = 'ALL';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    const filters: { status?: 'ISSUED' | 'REVOKED' } = {};
    if (this.statusFilter !== 'ALL') {
      filters.status = this.statusFilter;
    }
    this.issuedCertificationService.listForAdmin(filters).subscribe({
      next: (data) => {
        this.list = data;
        this.loading = false;
      },
      error: (err: unknown) => {
        this.error = this.errMessage(err);
        this.loading = false;
      },
    });
  }

  onFilterChange(): void {
    this.load();
  }

  revoke(item: IssuedCertification): void {
    if (item.status === 'REVOKED') {
      return;
    }
    this.revokingId = item.id;
    this.error = null;
    this.success = null;
    this.issuedCertificationService.revoke(item.id).subscribe({
      next: () => {
        this.success = 'Certificate revoked.';
        this.revokingId = null;
        this.load();
      },
      error: (err: unknown) => {
        this.error = this.errMessage(err);
        this.revokingId = null;
      },
    });
  }

  private errMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      return (err.error?.message as string) || err.message || 'Request failed';
    }
    return 'Request failed';
  }
}
