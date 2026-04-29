import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormationService } from '../../services/formation.service';
import { Formation } from '../../models/formation.models';

@Component({
  selector: 'app-formation-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './formation-list.component.html',
  styleUrl: './formation-list.component.css'
})
export class FormationListComponent implements OnInit, OnDestroy {
  formations: Formation[] = [];
  loading = true;
  error: string | null = null;
  searchQuery = '';
  category = '';
  level = '';
  page = 0;
  size = 12;
  totalElements = 0;
  totalPages = 0;

  private searchSubject = new Subject<string>();
  private searchSubscription: { unsubscribe: () => void } | null = null;

  categories = ['', 'Web', 'Mobile', 'Data', 'Cloud', 'General'];
  levels = ['', 'Beginner', 'Intermediate', 'Advanced'];

  constructor(private formationService: FormationService) {}

  ngOnInit(): void {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.page = 0;
      this.loadFormations();
    });
    this.loadFormations();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  loadFormations(): void {
    this.loading = true;
    this.error = null;
    this.formationService.getFormations({
      category: this.category || undefined,
      level: this.level || undefined,
      search: this.searchQuery?.trim() || undefined,
      page: this.page,
      size: this.size
    }).subscribe({
      next: (data) => {
        this.formations = data.content || [];
        this.totalElements = data.totalElements ?? 0;
        this.totalPages = data.totalPages ?? 0;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load formations';
        this.loading = false;
      }
    });
  }

  onFilterChange(): void {
    this.page = 0;
    this.loadFormations();
  }

  goToPage(p: number): void {
    if (p >= 0 && p < this.totalPages) {
      this.page = p;
      this.loadFormations();
    }
  }
}
