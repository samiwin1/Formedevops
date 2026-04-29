import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FormationService } from '../../../services/formation.service';
import { Formation } from '../../../models/formation.models';

@Component({
  selector: 'app-formation-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './formation-edit.component.html',
  styleUrl: './formation-edit.component.css'
})
export class FormationEditComponent implements OnInit {
  formationId!: number;
  formation: Partial<Formation> = {};
  categoryOptions = ['Web', 'Mobile', 'Data', 'Cloud', 'General'];
  levelOptions = ['Beginner', 'Intermediate', 'Advanced'];
  loading = true;
  saving = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formationService: FormationService
  ) {}

  ngOnInit(): void {
    this.formationId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.formationId) {
      this.router.navigate(['/admin/formations']);
      return;
    }
    this.load();
  }

  load(): void {
    this.formationService.getById(this.formationId).subscribe({
      next: (f) => {
        this.formation = f;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load';
        this.loading = false;
      }
    });
  }

  save(): void {
    this.saving = true;
    this.error = null;
    this.formationService.update(this.formationId, this.formation as Formation).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/admin/formations']);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to save';
        this.saving = false;
      }
    });
  }
}
