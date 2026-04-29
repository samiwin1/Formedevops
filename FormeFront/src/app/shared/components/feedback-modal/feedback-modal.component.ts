import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, effect, signal } from '@angular/core';
import { SubmitFeedbackRequest } from '../../../core/models/certification.models';
import { FeedbackService } from '../../../core/services/feedback.service';

@Component({
  standalone: true,
  selector: 'app-feedback-modal',
  imports: [CommonModule],
  templateUrl: './feedback-modal.component.html',
  styleUrls: ['./feedback-modal.component.css'],
})
export class FeedbackModalComponent {
  @Input({ required: true }) sessionId!: number;
  @Input({ required: true }) issuedCertificationId!: number;

  @Output() submitted = new EventEmitter<void>();
  @Output() dismissed = new EventEmitter<void>();

  readonly sessionRating = signal<number>(0);
  readonly evaluatorRating = signal<number>(0);
  readonly hoveredSessionRating = signal<number>(0);
  readonly hoveredEvaluatorRating = signal<number>(0);
  readonly comment = signal<string>('');
  readonly submitting = signal<boolean>(false);
  readonly isSubmitted = signal<boolean>(false);
  readonly errorMsg = signal<string | null>(null);

  constructor(private readonly feedbackService: FeedbackService) {
    effect(() => {
      if (this.isSubmitted()) {
        setTimeout(() => this.submitted.emit(), 2000);
      }
    });
  }

  updateComment(value: string): void {
    if (value.length > 500) {
      this.comment.set(value.slice(0, 500));
    } else {
      this.comment.set(value);
    }
  }

  canSubmit(): boolean {
    return (
      !this.submitting() &&
      this.sessionRating() >= 1 &&
      this.evaluatorRating() >= 1
    );
  }

  onSkip(): void {
    this.dismissed.emit();
  }

  onSubmit(): void {
    if (!this.canSubmit()) {
      return;
    }
    this.submitting.set(true);
    this.errorMsg.set(null);

    const payload: SubmitFeedbackRequest = {
      sessionRating: this.sessionRating(),
      evaluatorRating: this.evaluatorRating(),
      comment: this.comment() || undefined,
      issuedCertificationId: this.issuedCertificationId,
      sessionId: this.sessionId,
    };

    this.feedbackService.submitFeedback(payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.isSubmitted.set(true);
      },
      error: (err) => {
        this.submitting.set(false);
        const message =
          err?.error?.message || err?.message || 'Failed to submit feedback.';
        this.errorMsg.set(message);
      },
    });
  }

  ratingLabel(value: number): string {
    if (value <= 0) {
      return 'Select a rating';
    }
    if (value === 1) {
      return 'Poor';
    }
    if (value === 2) {
      return 'Fair';
    }
    if (value === 3) {
      return 'Good';
    }
    if (value === 4) {
      return 'Very good';
    }
    return 'Excellent';
  }
}

