import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormationService } from '../../services/formation.service';
import { EvaluationService } from '../../services/evaluation.service';
import { ExamService } from '../../services/exam.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  Formation,
  EvaluationHistoryItem,
  ExamHistoryItem
} from '../../models/formation.models';

@Component({
  selector: 'app-formation-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './formation-history.component.html',
  styleUrl: './formation-history.component.css'
})
export class FormationHistoryComponent implements OnInit {
  formationId!: number;
  formation: Formation | null = null;
  evaluationHistory: EvaluationHistoryItem[] = [];
  examHistory: ExamHistoryItem[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formationService: FormationService,
    private evaluationService: EvaluationService,
    private examService: ExamService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.formationId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.formationId) {
      this.router.navigate(['/formations']);
      return;
    }
    this.loadData();
  }

  loadData(): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: `/formations/${this.formationId}/history` } });
      return;
    }

    this.loading = true;
    this.error = null;

    this.formationService.getById(this.formationId).subscribe({
      next: (f) => {
        this.formation = f;
        this.evaluationService.getHistory(userId, this.formationId).subscribe({
          next: (evals) => {
            this.evaluationHistory = evals;
            this.examService.getHistory(userId, this.formationId).subscribe({
              next: (exams) => {
                this.examHistory = exams;
                this.loading = false;
              },
              error: (err) => {
                this.error = err.error?.message || 'Failed to load exam history';
                this.loading = false;
              }
            });
          },
          error: (err) => {
            this.error = err.error?.message || 'Failed to load evaluation history';
            this.loading = false;
          }
        });
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load formation';
        this.loading = false;
      }
    });
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  }
}
