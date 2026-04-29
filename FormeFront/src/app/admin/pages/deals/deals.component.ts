import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BusinessService } from '../../../core/services/business.service';
import { Deal } from '../../../core/models/business.models';

@Component({
  selector: 'app-deals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './deals.component.html',
})
export class DealsComponent implements OnInit {

  private businessService = inject(BusinessService);

  deals: Deal[] = [];
  filteredDeals: Deal[] = [];
  searchTerm = '';

  loading = false;
  showModal = false;
  isEdit = false;
  deleteId: number | null = null;
  showDeleteModal = false;
  errorMessage: string | null = null;

  form: Deal = { title: '', description: '', partnerId: 0, startDate: '', endDate: '' };

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.businessService.getDeals().subscribe({
      next: (data: Deal[]) => {
        this.deals = data;
        this.filteredDeals = data;
        this.loading = false;
        this.applyFilter();
      },
      error: (err) => { console.error('Load error:', err); this.loading = false; }
    });
  }

  // ✅ Calcul du statut selon startDate / endDate
  getStatus(d: Deal): 'active' | 'upcoming' | 'finished' {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(d.startDate);
    const end   = new Date(d.endDate);
    if (today < start) return 'upcoming';
    if (today > end)   return 'finished';
    return 'active';
  }

  getBadgeClass(d: Deal): string {
    return {
      active:   'bg-success',
      upcoming: 'bg-info',
      finished: 'bg-secondary',
    }[this.getStatus(d)];
  }

  getBadgeLabel(d: Deal): string {
    return {
      active:   'Active',
      upcoming: 'Upcoming',
      finished: 'Finished',
    }[this.getStatus(d)];
  }

  getBadgeIcon(d: Deal): string {
    return {
      active:   'feather-play-circle',
      upcoming: 'feather-clock',
      finished: 'feather-check-circle',
    }[this.getStatus(d)];
  }

  getCountByStatus(status: 'active' | 'upcoming' | 'finished'): number {
    return this.deals.filter(d => this.getStatus(d) === status).length;
  }

  // ✅ Filtre sur titre, description, partnerId + statut textuel
  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredDeals = this.deals;
      return;
    }
    this.filteredDeals = this.deals.filter(d =>
      d.title.toLowerCase().includes(term) ||
      d.description.toLowerCase().includes(term) ||
      String(d.partnerId).includes(term) ||
      this.getBadgeLabel(d).toLowerCase().includes(term)
    );
  }

  openCreate(): void {
    this.isEdit = false;
    this.errorMessage = null;
    this.form = { title: '', description: '', partnerId: 0, startDate: '', endDate: '' };
    this.showModal = true;
  }

  openEdit(d: Deal): void {
    this.isEdit = true;
    this.errorMessage = null;
    this.form = { ...d };
    this.showModal = true;
  }

  save(): void {
    this.errorMessage = null;
    if (this.isEdit && this.form.id) {
      this.businessService.updateDeal(this.form.id, this.form).subscribe({
        next: () => { this.showModal = false; this.load(); },
        error: (err) => { this.errorMessage = err.error?.message || 'Update failed'; }
      });
    } else {
      this.businessService.createDeal(this.form).subscribe({
        next: () => { this.showModal = false; this.load(); },
        error: (err) => { this.errorMessage = err.error?.message || 'Create failed'; }
      });
    }
  }

  confirmDelete(id: number): void { this.deleteId = id; this.showDeleteModal = true; }

  doDelete(): void {
    if (this.deleteId) {
      this.businessService.deleteDeal(this.deleteId).subscribe({
        next: () => { this.showDeleteModal = false; this.deleteId = null; this.load(); },
        error: (err) => { console.error('Delete error:', err); }
      });
    }
  }
}