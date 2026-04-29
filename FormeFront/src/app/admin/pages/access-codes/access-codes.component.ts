import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BusinessService } from '../../../core/services/business.service';
import { PdfService } from '../../../core/services/Pdf.sevice';
import { AccessCode, Partner, Deal } from '../../../core/models/business.models';

@Component({
  selector: 'app-access-codes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './access-codes.component.html',
})
export class AccessCodesComponent implements OnInit {

  private businessService = inject(BusinessService);
  private pdfService      = inject(PdfService);   // ✅ injection PDF service

  accessCodes: AccessCode[] = [];
  filteredCodes: AccessCode[] = [];
  searchTerm = '';

  partners: Partner[] = [];
  deals: Deal[] = [];
  filteredDeals: Deal[] = [];

  loading = false;
  showModal = false;
  showGenerateModal = false;
  isEdit = false;
  deleteId: number | null = null;
  showDeleteModal = false;
  errorMessage: string | null = null;
  generateError: string | null = null;
  generating = false;

  form: AccessCode = { code: '', partnerId: 0, dealId: 0, expirationDate: '', used: false };

  generateForm = {
    partnerId: 0, dealId: 0, expirationDate: '',
    prefix: 'CODE', quantity: 1,
  };

  previewCodes: string[] = [];

  ngOnInit(): void {
    this.load();
    this.loadPartnersAndDeals();
  }

  load(): void {
    this.loading = true;
    this.businessService.getAccessCodes().subscribe({
      next: (data) => {
        this.accessCodes = data;
        this.filteredCodes = data;
        this.loading = false;
        this.applyFilter();
      },
      error: (err) => { console.error(err); this.loading = false; }
    });
  }

  loadPartnersAndDeals(): void {
    this.businessService.getPartners().subscribe({ next: (data) => { this.partners = data; } });
    this.businessService.getDeals().subscribe({ next: (data) => { this.deals = data; } });
  }

  // ── PDF EXPORT ───────────────────────────────────────────────────────────

  // ✅ Export toute la liste (ou la liste filtrée)
  exportPDF(): void {
    this.pdfService.exportAccessCodes(this.filteredCodes, this.partners, this.deals);
  }

  // ✅ Export un seul code en carte individuelle
  exportSinglePDF(code: AccessCode): void {
    const partner = this.partners.find(p => p.id === code.partnerId)?.name || `#${code.partnerId}`;
    const deal    = this.deals.find(d => d.id === code.dealId)?.title    || `#${code.dealId}`;
    this.pdfService.exportSingleCode(code, partner, deal);
  }

  // ── Badge helpers ─────────────────────────────────────────────────────────
  getStatus(code: AccessCode): 'used' | 'expired' | 'active' {
    if (code.used) return 'used';
    if (new Date(code.expirationDate) < new Date()) return 'expired';
    return 'active';
  }

  getBadgeClass(code: AccessCode): string {
    return { used: 'bg-secondary', expired: 'bg-danger', active: 'bg-success' }[this.getStatus(code)];
  }

  getBadgeLabel(code: AccessCode): string {
    return { used: 'Used', expired: 'Expired', active: 'Active' }[this.getStatus(code)];
  }

  getCountByStatus(status: 'active' | 'expired' | 'used'): number {
    return this.accessCodes.filter(c => this.getStatus(c) === status).length;
  }

  // ── Filtre ────────────────────────────────────────────────────────────────
  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) { this.filteredCodes = this.accessCodes; return; }
    this.filteredCodes = this.accessCodes.filter(c =>
      c.code.toLowerCase().includes(term) ||
      String(c.partnerId).includes(term) ||
      String(c.dealId).includes(term) ||
      this.getBadgeLabel(c).toLowerCase().includes(term)
    );
  }

  // ── Génération automatique ────────────────────────────────────────────────
  onPartnerChange(): void {
    this.generateForm.dealId = 0;
    const selectedId = Number(this.generateForm.partnerId);
    this.filteredDeals = this.deals.filter(d => Number(d.partnerId) === selectedId);
    this.previewCodes = [];
  }

  openGenerateModal(): void {
    this.generateError = null;
    this.previewCodes = [];
    this.generateForm = {
      partnerId: 0, dealId: 0,
      expirationDate: this.defaultExpiration(),
      prefix: 'CODE', quantity: 1,
    };
    this.filteredDeals = [];
    this.showGenerateModal = true;
  }

  defaultExpiration(): string {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  }

  generateCode(prefix: string): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const seg = (n: number) => Array.from({ length: n }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
    return `${prefix.toUpperCase()}-${seg(4)}-${seg(4)}`;
  }

  generatePreview(): void {
    if (!this.generateForm.partnerId || !this.generateForm.dealId) {
      this.generateError = 'Please select a partner and a deal first.';
      return;
    }
    this.generateError = null;
    this.previewCodes = Array.from({ length: this.generateForm.quantity }, () =>
      this.generateCode(this.generateForm.prefix)
    );
  }

  regenerateOne(index: number): void {
    this.previewCodes[index] = this.generateCode(this.generateForm.prefix);
  }

  confirmGenerate(): void {
    if (!this.previewCodes.length) { this.generateError = 'Generate a preview first.'; return; }
    this.generating = true;
    this.generateError = null;
    let saved = 0;
    this.previewCodes.forEach(code => {
      const payload: AccessCode = {
        code, partnerId: this.generateForm.partnerId,
        dealId: this.generateForm.dealId,
        expirationDate: this.generateForm.expirationDate,
        used: false,
      };
      this.businessService.createAccessCode(payload).subscribe({
        next: () => {
          saved++;
          if (saved === this.previewCodes.length) {
            this.generating = false;
            this.showGenerateModal = false;
            this.load();
          }
        },
        error: (err) => {
          this.generating = false;
          this.generateError = 'Error: ' + (err.error?.message || err.message);
        }
      });
    });
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────
  openCreate(): void {
    this.isEdit = false; this.errorMessage = null;
    this.form = { code: '', partnerId: 0, dealId: 0, expirationDate: '', used: false };
    this.showModal = true;
  }

  openEdit(c: AccessCode): void {
    this.isEdit = true; this.errorMessage = null;
    this.form = { ...c }; this.showModal = true;
  }

  save(): void {
    this.errorMessage = null;
    if (this.isEdit && this.form.id) {
      this.businessService.updateAccessCode(this.form.id, this.form).subscribe({
        next: () => { this.showModal = false; this.load(); },
        error: (err) => { this.errorMessage = err.error?.message || 'Update failed'; }
      });
    } else {
      this.businessService.createAccessCode(this.form).subscribe({
        next: () => { this.showModal = false; this.load(); },
        error: (err) => { this.errorMessage = err.error?.message || 'Create failed'; }
      });
    }
  }

  confirmDelete(id: number): void { this.deleteId = id; this.showDeleteModal = true; }

  doDelete(): void {
    if (this.deleteId) {
      this.businessService.deleteAccessCode(this.deleteId).subscribe({
        next: () => { this.showDeleteModal = false; this.deleteId = null; this.load(); },
        error: (err) => { console.error(err); }
      });
    }
  }

  getPartnerName(id: number): string { return this.partners.find(p => p.id === id)?.name || `#${id}`; }
  getDealTitle(id: number): string   { return this.deals.find(d => d.id === id)?.title   || `#${id}`; }
}