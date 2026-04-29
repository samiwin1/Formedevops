import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import { FormationService } from '../../services/formation.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ResultExamen } from '../../models/formation.models';

@Component({
  selector: 'app-exam-result',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './exam-result.component.html',
  styleUrl: './exam-result.component.css'
})
export class ExamResultComponent implements OnInit {
  formationId!: number;
  result: ResultExamen | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private examService: ExamService,
    private formationService: FormationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.formationId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.formationId) return;
    this.loadResult();
  }

  loadResult(): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.error = 'You must be logged in to view results.';
      this.loading = false;
      return;
    }
    this.examService.getUserResults(userId).subscribe({
      next: (results) => {
        this.examService.getByFormationId(this.formationId).subscribe({
          next: (exam) => {
            if (exam) {
              this.result = results.find(r => r.examen_id === exam.id) ?? null;
            }
            this.loading = false;
          },
          error: () => {
            this.loading = false;
          }
        });
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load result';
        this.loading = false;
      }
    });
  }
}
