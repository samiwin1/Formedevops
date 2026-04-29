import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ExamService } from '../../services/exam.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Examen } from '../../models/formation.models';
import { parseStructuredContent, StructuredContent } from '../../utils/quiz-scoring';

const SAVE_INTERVAL_MS = 30000;
const POLL_INTERVAL_MS = 10000;

@Component({
  selector: 'app-exam',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './exam.component.html',
  styleUrl: './exam.component.css'
})
export class ExamComponent implements OnInit, OnDestroy {
  formationId!: number;
  exam: Examen | null = null;
  structuredContent: StructuredContent | null = null;
  userSelections: Record<number, number> = {};
  userAnswers = '';
  timeLeft = 0;
  timerInterval: ReturnType<typeof setInterval> | null = null;
  saveInterval: ReturnType<typeof setInterval> | null = null;
  pollInterval: ReturnType<typeof setInterval> | null = null;
  submitted = false;
  loading = true;
  error: string | null = null;
  submitting = false;
  examStarted = false;
  resultExamenId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private examService: ExamService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.formationId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.formationId) {
      this.router.navigate(['/formations']);
      return;
    }
    this.loadExam();
  }

  ngOnDestroy(): void {
    this.clearIntervals();
  }

  private clearIntervals(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  loadExam(): void {
    this.examService.getByFormationId(this.formationId).subscribe({
      next: (exam) => {
        this.exam = exam;
        if (exam) {
          this.structuredContent = parseStructuredContent(exam.content);
        } else {
          this.error = 'No exam found for this formation.';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load exam';
        this.loading = false;
      }
    });
  }

  startExam(): void {
    const userId = this.authService.getUserId();
    if (!userId || !this.exam?.id) {
      this.error = 'You must be logged in to start the exam.';
      return;
    }

    this.examService.startExam(this.exam.id, userId).subscribe({
      next: (result) => {
        this.resultExamenId = result.id ?? null;
        this.examStarted = true;
        this.timeLeft = (this.exam?.duration_minutes ?? 60) * 60;
        this.pollRemainingTime();
        this.startSaveInterval();
        this.startDisplayTimer();
      },
      error: (err) => {
        this.error = err.error?.message || err.status === 403
          ? 'You are not eligible to start this exam. Complete all quizzes first.'
          : 'Failed to start exam';
      }
    });
  }

  private pollRemainingTime(): void {
    if (!this.resultExamenId || this.submitted) return;

    const poll = () => {
      if (!this.resultExamenId || this.submitted) return;
      this.examService.getRemainingTime(this.resultExamenId).subscribe({
        next: (res) => {
          this.timeLeft = res.remainingSeconds;
          if (this.timeLeft <= 0) {
            this.autoSubmit();
          }
        },
        error: () => {}
      });
    };

    poll();
    this.pollInterval = setInterval(poll, POLL_INTERVAL_MS);
  }

  private startSaveInterval(): void {
    if (!this.resultExamenId || this.submitted) return;

    const save = () => {
      if (!this.resultExamenId || this.submitted || this.submitting) return;
      const answers = this.toAnswersMap();
      this.examService.saveAnswer(this.resultExamenId!, answers).subscribe({
        error: () => {}
      });
    };

    this.saveInterval = setInterval(save, SAVE_INTERVAL_MS);
  }

  private startDisplayTimer(): void {
    this.timerInterval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
      }
      if (this.timeLeft <= 0) {
        this.clearIntervals();
        this.autoSubmit();
      }
    }, 1000);
  }

  private toAnswersMap(): Record<string, number> {
    const out: Record<string, number> = {};
    if (this.structuredContent) {
      for (let i = 0; i < this.structuredContent.questions.length; i++) {
        const sel = this.userSelections[i];
        if (typeof sel === 'number' && sel >= 0) {
          out[String(i)] = sel;
        }
      }
    }
    return out;
  }

  formatTime(seconds: number): string {
    const m = Math.floor(Math.max(0, seconds) / 60);
    const s = Math.max(0, seconds) % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  get canSubmit(): boolean {
    if (!this.exam?.id || !this.resultExamenId) return false;
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
    if (this.submitted || this.submitting || !this.resultExamenId) return;

    this.submitting = true;
    this.clearIntervals();

    const onSubmitSuccess = () => {
      this.submitted = true;
      this.submitting = false;
      this.router.navigate(['/formations', this.formationId, 'result']);
    };

    const onSubmitError = (err: { error?: { message?: string } }) => {
      const msg = err?.error?.message || '';
      if (msg.includes('already ended')) {
        onSubmitSuccess();
      } else {
        this.error = msg || 'Failed to submit exam';
        this.submitting = false;
      }
    };

    this.examService.saveAnswer(this.resultExamenId, this.toAnswersMap()).subscribe({
      next: () => {
        this.examService.submitExam(this.resultExamenId!).subscribe({
          next: onSubmitSuccess,
          error: onSubmitError
        });
      },
      error: () => {
        this.examService.submitExam(this.resultExamenId!).subscribe({
          next: onSubmitSuccess,
          error: onSubmitError
        });
      }
    });
  }

  autoSubmit(): void {
    if (!this.submitted && !this.submitting && this.resultExamenId) {
      this.submit();
    }
  }
}
