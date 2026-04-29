import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BusinessService } from '../../../core/services/business.service';
import { Partner } from '../../../core/models/business.models';

@Component({
  selector: 'app-partners',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './partners.component.html',
})
export class PartnersComponent implements OnInit {

  private businessService = inject(BusinessService);

  partners: Partner[] = [];
  filteredPartners: Partner[] = [];   // ✅ liste filtrée affichée
  searchTerm = '';                     // ✅ terme de recherche

  loading = false;
  showModal = false;
  isEdit = false;
  deleteId: number | null = null;
  showDeleteModal = false;
  errorMessage: string | null = null;

  form: Partner = { name: '', contactEmail: '', contactPhone: '' };

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.businessService.getPartners().subscribe({
      next: (data: Partner[]) => {
        this.partners = data;
        this.filteredPartners = data;   // ✅ initialise la liste filtrée
        this.loading = false;
        this.applyFilter();             // ✅ réapplique le filtre si recherche active
      },
      error: (err) => { console.error('Load error:', err); this.loading = false; }
    });
  }

  // ✅ Filtre en temps réel
  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredPartners = this.partners;
      return;
    }
    this.filteredPartners = this.partners.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.contactEmail.toLowerCase().includes(term) ||
      p.contactPhone.toLowerCase().includes(term)
    );
  }

  openCreate(): void {
    this.isEdit = false;
    this.errorMessage = null;
    this.form = { name: '', contactEmail: '', contactPhone: '' };
    this.showModal = true;
  }

  openEdit(p: Partner): void {
    this.isEdit = true;
    this.errorMessage = null;
    this.form = { ...p };
    this.showModal = true;
  }

  save(): void {
    this.errorMessage = null;
    if (this.isEdit && this.form.id) {
      this.businessService.updatePartner(this.form.id, this.form).subscribe({
        next: () => { this.showModal = false; this.load(); },
        error: (err) => { this.errorMessage = err.error?.message || 'Update failed'; }
      });
    } else {
      this.businessService.createPartner(this.form).subscribe({
        next: () => { this.showModal = false; this.load(); },
        error: (err) => { this.errorMessage = err.error?.message || 'Create failed'; }
      });
    }
  }

  confirmDelete(id: number): void {
    this.deleteId = id;
    this.showDeleteModal = true;
  }

  doDelete(): void {
    if (this.deleteId) {
      this.businessService.deletePartner(this.deleteId).subscribe({
        next: () => { this.showDeleteModal = false; this.deleteId = null; this.load(); },
        error: (err) => { console.error('Delete error:', err); }
      });
    }
  }
}