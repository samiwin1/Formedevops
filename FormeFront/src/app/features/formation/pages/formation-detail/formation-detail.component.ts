import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormationService } from '../../services/formation.service';
import { EvaluationService } from '../../services/evaluation.service';
import { ExamService } from '../../services/exam.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Formation, ContenuFormation, Evaluation, ResultEvaluation, FormationProgressResponse } from '../../models/formation.models';
import { EvaluationQuizComponent } from '../evaluation-quiz/evaluation-quiz.component';

export type FormationStep = { type: 'content'; block: ContenuFormation; index: number } | { type: 'quiz'; block: ContenuFormation; evaluation: Evaluation; index: number };

@Component({
  selector: 'app-formation-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, EvaluationQuizComponent],
  templateUrl: './formation-detail.component.html',
  styleUrl: './formation-detail.component.css'
})
export class FormationDetailComponent implements OnInit {
  formationId!: number;
  formation: Formation | null = null;
  contentBlocks: ContenuFormation[] = [];
  evaluations: Evaluation[] = [];
  userResults: ResultEvaluation[] = [];
  steps: FormationStep[] = [];
  viewMode: 'overview' | 'learning' | 'exam-cta' = 'overview';
  currentStepIndex = 0;
  loading = true;
  error: string | null = null;
  examEligible = false;
  hasExam = false;
  progress: FormationProgressResponse | null = null;
  completionPercentage = 0;
  resetInProgress = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formationService: FormationService,
    private evaluationService: EvaluationService,
    private examService: ExamService,
    public authService: AuthService
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
    this.loading = true;
    this.error = null;
    const userId = this.authService.getUserId();

    this.formationService.getById(this.formationId).subscribe({
      next: (f) => {
        this.formation = f;
        this.formationService.getContentByFormationId(this.formationId).subscribe({
          next: (content) => {
            this.contentBlocks = content.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
            this.evaluationService.getByFormationId(this.formationId).subscribe({
              next: (evals) => {
                this.evaluations = evals;
                this.buildSteps();
                this.examService.getByFormationId(this.formationId).subscribe({
                  next: (exam) => {
                    this.hasExam = !!exam;
                    this.formationService.getFormationProgress(this.formationId, userId).subscribe({
                      next: (progress) => {
                        this.progress = progress;
                        this.examEligible = progress.examEligible;
                        this.completionPercentage = progress.completionPercentage;
                        if (userId) {
                          this.evaluationService.getUserResults(userId).subscribe({
                            next: (results) => {
                              this.userResults = results.filter(r =>
                                this.evaluations.some(e => e.id === r.evaluation_id)
                              );
                              this.restoreProgress();
                              this.loading = false;
                            },
                            error: () => {
                              this.restoreProgress();
                              this.loading = false;
                            }
                          });
                        } else {
                          this.restoreProgress();
                          this.loading = false;
                        }
                      },
                      error: () => {
                        this.restoreProgress();
                        this.loading = false;
                      }
                    });
                  },
                  error: () => {
                    this.hasExam = false;
                    this.formationService.getFormationProgress(this.formationId, userId).subscribe({
                      next: (progress) => {
                        this.progress = progress;
                        this.examEligible = progress.examEligible;
                        this.completionPercentage = progress.completionPercentage;
                        this.loading = false;
                      },
                      error: () => { this.loading = false; }
                    });
                  }
                });
              },
              error: (err) => {
                this.error = err.error?.message || 'Failed to load evaluations';
                this.loading = false;
              }
            });
          },
          error: (err) => {
            this.error = err.error?.message || 'Failed to load content';
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

  private buildSteps(): void {
    this.steps = [];
    const sortedEvals = [...this.evaluations].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
    let evalFallbackIndex = 0;
    for (const block of this.contentBlocks) {
      this.steps.push({ type: 'content', block, index: this.steps.length });
      let evalId = this.getEvalId(block);
      if (!evalId && block.content_type === 'quiz' && evalFallbackIndex < sortedEvals.length) {
        evalId = sortedEvals[evalFallbackIndex].id;
        evalFallbackIndex++;
      }
      if (evalId) {
        const evaluation = this.evaluations.find(e => e.id === evalId);
        if (evaluation) {
          this.steps.push({ type: 'quiz', block, evaluation, index: this.steps.length });
        }
      }
    }
  }

  private restoreProgress(): void {
    if (this.steps.length === 0) return;
    let lastCompleted = -1;
    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      if (step.type === 'quiz') {
        const passed = this.userResults.some(
          r => (r.evaluation_id === step.evaluation.id || (r.evaluation as { id?: number })?.id === step.evaluation.id) && r.passed
        );
        if (passed) lastCompleted = i;
      }
    }
    if (lastCompleted >= 0 && this.viewMode === 'overview') {
      this.viewMode = 'learning';
      this.currentStepIndex = Math.min(lastCompleted + 1, this.steps.length - 1);
      if (this.currentStepIndex >= this.steps.length) {
        this.viewMode = 'exam-cta';
      } else {
        const step = this.steps[this.currentStepIndex];
        if (step?.type === 'quiz' && !this.authService.getToken()) {
          this.router.navigate(['/login'], { queryParams: { returnUrl: `/formations/${this.formationId}` } });
        }
      }
    }
  }

  getEvalId(block: ContenuFormation): number | undefined {
    return block.evaluation_id ?? (block.evaluation as { id?: number })?.id;
  }

  /** Step is unlocked when backend progress says so. Uses step's block for correct mapping. */
  isStepUnlocked(stepIndex: number): boolean {
    if (!this.progress?.content?.length) return stepIndex === 0;
    const step = this.steps[stepIndex];
    if (!step) return false;
    const blockIndex = this.contentBlocks.indexOf(step.block);
    if (blockIndex < 0 || blockIndex >= this.progress.content.length) return false;
    return this.progress.content[blockIndex].unlocked;
  }

  isStepLocked(stepIndex: number): boolean {
    return !this.isStepUnlocked(stepIndex);
  }

  goToStep(stepIndex: number): void {
    if (this.isStepUnlocked(stepIndex)) {
      this.currentStepIndex = stepIndex;
      if (this.currentStepIndex >= this.steps.length) {
        this.viewMode = 'exam-cta';
      }
    }
  }

  get currentStep(): FormationStep | null {
    return this.steps[this.currentStepIndex] ?? null;
  }

  get hasQuizzes(): boolean {
    return this.contentBlocks.some(b => this.getEvalId(b));
  }

  startFormation(): void {
    if (this.hasQuizzes && !this.authService.getToken()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: `/formations/${this.formationId}` } });
      return;
    }
    if (this.steps.length === 0) return;
    this.viewMode = 'learning';
    this.currentStepIndex = 0;
  }

  startQuizFromContent(): void {
    const step = this.currentStep;
    if (!step || step.type !== 'content') return;
    if (this.currentStepIndex + 1 < this.steps.length && this.steps[this.currentStepIndex + 1].type === 'quiz') {
      this.currentStepIndex++;
    }
  }

  goToNextContent(): void {
    const step = this.currentStep;
    if (!step || step.type !== 'content') return;
    this.advanceToNext();
  }

  hasNextStepQuiz(): boolean {
    const step = this.currentStep;
    if (!step || step.type !== 'content') return false;
    return this.currentStepIndex + 1 < this.steps.length && this.steps[this.currentStepIndex + 1].type === 'quiz';
  }

  onResetRequested(): void {
    const userId = this.authService.getUserId();
    if (!userId) return;
    this.resetInProgress = true;
    this.formationService.resetFormationProgress(this.formationId, userId).subscribe({
      next: () => {
        this.currentStepIndex = 0;
        this.viewMode = 'learning';
        this.loadData();
        this.resetInProgress = false;
      },
      error: () => {
        this.resetInProgress = false;
      }
    });
  }

  onQuizComplete(passed: boolean): void {
    const userId = this.authService.getUserId();
    if (userId) {
      this.formationService.getFormationProgress(this.formationId, userId).subscribe({
        next: (progress) => {
          this.progress = progress;
          this.examEligible = progress.examEligible;
          this.completionPercentage = progress.completionPercentage;
          this.evaluationService.getUserResults(userId).subscribe({
            next: (results) => {
              this.userResults = results.filter(r =>
                this.evaluations.some(e => e.id === r.evaluation_id)
              );
              if (passed) this.advanceToNext();
            },
            error: () => { if (passed) this.advanceToNext(); }
          });
        },
        error: () => { if (passed) this.advanceToNext(); }
      });
    } else {
      if (passed) this.advanceToNext();
    }
  }

  private advanceToNext(): void {
    this.currentStepIndex++;
    if (this.currentStepIndex >= this.steps.length) {
      this.viewMode = 'exam-cta';
    }
  }

  goToPrevStep(): void {
    if (this.currentStepIndex > 0) {
      const prev = this.steps[this.currentStepIndex - 1];
      if (prev.type === 'content') {
        this.currentStepIndex--;
      }
    }
  }

  canGoBack(): boolean {
    if (this.currentStepIndex <= 0) return false;
    const prev = this.steps[this.currentStepIndex - 1];
    return prev.type === 'content';
  }

  get hasHistory(): boolean {
    return !!this.authService.getUserId() && (this.userResults.length > 0 || this.completionPercentage > 0);
  }

  goToExam(): void {
    if (this.examEligible && this.hasExam) {
      this.router.navigate(['/formations', this.formationId, 'exam']);
    }
  }
}
