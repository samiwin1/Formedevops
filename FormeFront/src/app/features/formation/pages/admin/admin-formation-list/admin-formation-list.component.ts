import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormationService } from '../../../services/formation.service';
import { Formation } from '../../../models/formation.models';

@Component({
  selector: 'app-admin-formation-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-formation-list.component.html',
  styleUrl: './admin-formation-list.component.css'
})
export class AdminFormationListComponent implements OnInit {
  formations: Formation[] = [];
  loading = true;
  error: string | null = null;
  expandedId: number | null = null;

  constructor(private formationService: FormationService) {}

  toggleExpand(id: number): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  formatDate(value: string | undefined): string {
    if (!value) return '';
    const d = new Date(value);
    return d.toLocaleDateString(undefined, { dateStyle: 'medium' });
  }

  ngOnInit(): void {
    this.loadFormations();
  }

  loadFormations(): void {
    this.loading = true;
    this.error = null;
    this.formationService.getAll().subscribe({
      next: (data) => {
        this.formations = data || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load formations';
        this.loading = false;
      }
    });
  }

  delete(id: number): void {
    if (!confirm('Are you sure you want to delete this formation?')) return;
    this.formationService.delete(id).subscribe({
      next: () => this.loadFormations(),
      error: (err) => {
        this.error = err.error?.message || 'Failed to delete';
      }
    });
  }
}
