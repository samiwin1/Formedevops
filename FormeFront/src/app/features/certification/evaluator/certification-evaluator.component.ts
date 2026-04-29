import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AssignmentService } from '../../../core/services/assignment.service';
import { EvaluatorSessionDto } from '../../../core/models/certification.models';

@Component({
  standalone: true,
  selector: 'app-certification-evaluator',
  imports: [CommonModule],
  templateUrl: './certification-evaluator.component.html',
  styleUrls: ['./certification-evaluator.component.css'],
})
export class CertificationEvaluatorComponent implements OnInit {
  private readonly assignmentService = inject(AssignmentService);

  // State signals
  sessions = signal<EvaluatorSessionDto[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Grading form state
  gradingAssignmentId = signal<number | null>(null);
  gradeScore = signal<number | null>(null);
  gradeComment = signal('');
  submittingGrade = signal(false);
  gradeError = signal<string | null>(null);
  activeGradeContext = computed(() => {
    const assignmentId = this.gradingAssignmentId();
    if (!assignmentId) {
      return null;
    }
    for (const session of this.sessions()) {
      const assignment = session.assignments.find((a) => a.assignmentId === assignmentId);
      if (assignment) {
        return {
          sessionTitle: session.title,
          certificationTitle: session.certificationTitle,
          assignment,
        };
      }
    }
    return null;
  });

  // Computed signals
  plannedSessions = computed(() =>
    this.sessions()
      .filter((s) => s.status === 'PLANNED')
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
  );

  doneSessions = computed(() =>
    this.sessions()
      .filter((s) => s.status === 'DONE')
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
  );

  totalToGrade = computed(() =>
    this.sessions().reduce(
      (acc, s) => acc + s.assignments.filter((a) => a.canGrade).length,
      0
    )
  );

  totalGraded = computed(() =>
    this.sessions().reduce(
      (acc, s) => acc + s.assignments.filter((a) => a.oralScore !== null).length,
      0
    )
  );

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions(): void {
    this.loading.set(true);
    this.error.set(null);

    this.assignmentService.getMyEvaluatorSessions().subscribe({
      next: (data) => {
        this.sessions.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load sessions.');
        this.loading.set(false);
      },
    });
  }

  openGradeForm(assignmentId: number): void {
    this.gradingAssignmentId.set(assignmentId);
    this.gradeScore.set(null);
    this.gradeComment.set('');
    this.gradeError.set(null);
  }

  cancelGradeForm(): void {
    this.gradingAssignmentId.set(null);
    this.gradeError.set(null);
  }

  submitGrade(): void {
    const score = this.gradeScore();
    if (score === null || score < 0 || score > 20) {
      this.gradeError.set('Score must be between 0 and 20');
      return;
    }

    const assignmentId = this.gradingAssignmentId();
    if (!assignmentId) return;

    this.submittingGrade.set(true);
    this.gradeError.set(null);

    this.assignmentService
      .gradeAssignment(assignmentId, {
        oralScore: score,
        oralComment: this.gradeComment(),
      })
      .subscribe({
        next: () => {
          this.gradingAssignmentId.set(null);
          this.submittingGrade.set(false);
          this.loadSessions(); // refresh
        },
        error: (e) => {
          this.gradeError.set(e.error?.message || 'Failed to submit grade');
          this.submittingGrade.set(false);
        },
      });
  }

  markNoShow(assignmentId: number): void {
    if (!confirm('Mark this learner as NO SHOW?')) return;

    this.assignmentService.markNoShowEvaluator(assignmentId).subscribe({
      next: () => this.loadSessions(),
      error: () => alert('Failed to mark as no-show'),
    });
  }

  joinMeeting(link: string): void {
    window.open(link, '_blank');
  }
}
