import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BusinessService } from '../../../core/services/business.service';
import { Pack } from '../../../core/models/business.models';

@Component({
  selector: 'app-packs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './packs.component.html',
})
export class PacksComponent implements OnInit {

  private businessService = inject(BusinessService);

  packs: Pack[] = [];
  filteredPacks: Pack[] = [];       // ✅ liste filtrée
  searchTerm = '';                   // ✅ terme de recherche

  loading = false;
  showModal = false;
  isEdit = false;
  deleteId: number | null = null;
  showDeleteModal = false;
  errorMessage: string | null = null;

  form: Pack = { name: '', description: '', validityMonths: 1, active: true };

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.businessService.getPacks().subscribe({
      next: (data: Pack[]) => {
        this.packs = data;
        this.filteredPacks = data;
        this.loading = false;
        this.applyFilter();
      },
      error: (err) => { console.error('Load error:', err); this.loading = false; }
    });
  }

  // ✅ Filtre sur nom, description, statut actif/inactif
  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredPacks = this.packs;
      return;
    }
    this.filteredPacks = this.packs.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      (p.active ? 'active' : 'inactive').includes(term)
    );
  }

  openCreate(): void {
    this.isEdit = false;
    this.errorMessage = null;
    this.form = { name: '', description: '', validityMonths: 1, active: true };
    this.showModal = true;
  }

  openEdit(p: Pack): void {
    this.isEdit = true;
    this.errorMessage = null;
    this.form = { ...p };
    this.showModal = true;
  }

  save(): void {
    this.errorMessage = null;
    if (this.isEdit && this.form.id) {
      this.businessService.updatePack(this.form.id, this.form).subscribe({
        next: () => { this.showModal = false; this.load(); },
        error: (err) => { this.errorMessage = err.error?.message || 'Update failed'; }
      });
    } else {
      this.businessService.createPack(this.form).subscribe({
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
      this.businessService.deletePack(this.deleteId).subscribe({
        next: () => { this.showDeleteModal = false; this.deleteId = null; this.load(); },
        error: (err) => { console.error('Delete error:', err); }
      });
    }
  }
}