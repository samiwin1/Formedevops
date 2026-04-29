import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EvaluationService } from '../../services/evaluation.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Evaluation, MistakeExplanationItem, ResultEvaluation } from '../../models/formation.models';
import { parseStructuredContent, StructuredContent } from '../../utils/quiz-scoring';

@Component({
  selector: 'app-evaluation-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './evaluation-quiz.component.html',
  styleUrl: './evaluation-quiz.component.css'
})
export class EvaluationQuizComponent implements OnInit {
  @Input() evaluation!: Evaluation;
  @Input() formationId!: number;
  @Input() resetting = false;
  @Output() complete = new EventEmitter<boolean>();
  @Output() resetRequested = new EventEmitter<void>();

  structuredContent: StructuredContent | null = null;
  userSelections: Record<number, number> = {};
  userAnswers = '';
  attempts: ResultEvaluation[] = [];
  attemptCount = 0;
  maxAttempts = 3;
  alreadyPassed = false;
  noAttemptsLeft = false;
  submitted = false;
  score: number | null = null;
  passed = false;
  mistakeExplanations: MistakeExplanationItem[] = [];
  loading = false;
  loadingAttempts = true;
  error: string | null = null;

  constructor(
    private evaluationService: EvaluationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.structuredContent = parseStructuredContent(this.evaluation.content);
    this.maxAttempts = this.evaluation.max_attempts ?? 3;
    this.loadAttempts();
  }

  private loadAttempts(): void {
    const userId = this.authService.getUserId();
    if (!userId || !this.evaluation.id) {
      this.loadingAttempts = false;
      return;
    }
    this.evaluationService.getByEvaluationId(this.evaluation.id).subscribe({
      next: (results) => {
        this.attempts = results.filter(r => r.user_id === userId);
        this.attemptCount = this.attempts.length;
        this.alreadyPassed = this.attempts.some(r => r.passed);
        this.noAttemptsLeft = this.attemptCount >= this.maxAttempts && !this.alreadyPassed;
        this.loadingAttempts = false;
      },
      error: () => {
        this.loadingAttempts = false;
      }
    });
  }

  get canSubmit(): boolean {
    if (this.alreadyPassed || this.noAttemptsLeft) return false;
    if (this.structuredContent) {
      for (let i = 0; i < this.structuredContent.questions.length; i++) {
        const sel = this.userSelections[i];
        if (typeof sel !== 'number' || sel < 0) return false;
      }
      return true;
    }
    return (this.userAnswers || '').trim().length > 0;
  }

  submit(): void {
    if (!this.evaluation?.id || !this.canSubmit) return;
    const userId = this.authService.getUserId();
    if (!userId) {
      this.error = 'You must be logged in to submit.';
      return;
    }
    this.loading = true;
    this.error = null;

    const answers: Record<number, number> = {};
    if (this.structuredContent) {
      for (let i = 0; i < this.structuredContent.questions.length; i++) {
        const sel = this.userSelections[i];
        if (typeof sel === 'number') {
          answers[i] = sel;
        }
      }
    }

    this.evaluationService.submitEvaluation(this.evaluation.id, userId, answers).subscribe({
      next: (res) => {
        this.score = res.score;
        this.passed = res.passed;
        this.submitted = true;
        this.attemptCount = res.attemptNumber;
        this.noAttemptsLeft = res.remainingAttempts <= 0 && !res.passed;
        this.alreadyPassed = res.passed;
        this.mistakeExplanations = res.mistakeExplanations ?? [];
        this.loading = false;
      },
      error: (err) => {
        const msg = typeof err.error === 'object' && err.error?.message
          ? err.error.message
          : typeof err.error === 'string'
            ? err.error
            : 'Failed to submit';
        this.error = msg.toLowerCase().includes('maximum attempts') ? 'Maximum attempts reached' : msg;
        if (err.status === 400 && this.error === 'Maximum attempts reached') {
          this.noAttemptsLeft = true;
        }
        this.loading = false;
      }
    });
  }

  onComplete(passed: boolean): void {
    this.complete.emit(passed);
  }

  tryAgain(): void {
    this.submitted = false;
    this.error = null;
    this.score = null;
    this.passed = false;
    this.mistakeExplanations = [];
    this.userSelections = {};
    this.userAnswers = '';
  }

  onResetRequested(): void {
    this.resetRequested.emit();
  }
}
