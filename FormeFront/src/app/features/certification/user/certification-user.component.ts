import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { AssignmentService } from '../../../core/services/assignment.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { OralSessionService } from '../../../core/services/oral-session.service';
import {
  IssuedCertification,
  MyCertificationStatus,
  MyExamStatus,
  OralAssignment,
  OralSession,
} from '../../../core/models/certification.models';
import { forkJoin } from 'rxjs';

type CalendarDay = {
  dateLabel: string;
  sessions: OralSession[];
};

@Component({
  standalone: true,
  selector: 'app-certification-user',
  imports: [CommonModule, FormsModule],
  templateUrl: './certification-user.component.html',
  styleUrls: ['./certification-user.component.css'],
})
export class CertificationUserComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly assignmentService = inject(AssignmentService);
  private readonly oralSessionService = inject(OralSessionService);
  private readonly dashboardService = inject(DashboardService);

  loading = false;
  error: string | null = null;
  selectedFormationId: number | null = null;

  myAssignments: OralAssignment[] = [];
  myIssuedCertifications: IssuedCertification[] = [];
  mySessions: OralSession[] = [];
  calendarDays: CalendarDay[] = [];
  examStatus: MyExamStatus | null = null;
  certificationStatus: MyCertificationStatus | null = null;

  ngOnInit(): void {
    this.loadMyData();
  }

  isLearner(): boolean {
    return this.authService.isLearner();
  }

  loadMyData(): void {
    this.loading = true;
    this.error = null;

    if (!this.isLearner()) {
      this.loading = false;
      this.error = 'This page shows learner data only (my certifications and my oral-session calendar).';
      return;
    }

    forkJoin({
      assignments: this.assignmentService.myAssignments(),
      sessions: this.oralSessionService.list(),
      certifications: this.assignmentService.myIssuedCertifications(),
      examStatus: this.dashboardService.getMyExamStatus(this.selectedFormationId ?? undefined),
      certificationStatus: this.dashboardService.getMyCertificationStatus(this.selectedFormationId ?? undefined),
    }).subscribe({
      next: ({ assignments, sessions, certifications, examStatus, certificationStatus }) => {
        this.myAssignments = assignments;
        const mySessionIds = new Set(assignments.map((a) => a.oralSessionId));
        this.mySessions = sessions
          .filter((s) => mySessionIds.has(s.id))
          .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
        this.calendarDays = this.buildCalendar(this.mySessions);
        this.myIssuedCertifications = certifications;
        this.examStatus = examStatus;
        this.certificationStatus = certificationStatus;
        this.loading = false;
      },
      error: (err: unknown) => {
        this.loading = false;
        this.error = this.errorMessage(err, 'Failed to load learner certification data');
      },
    });
  }

  downloadPdf(certificationId: number): void {
    this.assignmentService.downloadCertificatePdf(certificationId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `certificate-${certificationId}.pdf`;
        anchor.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err: unknown) => {
        this.error = this.errorMessage(err, 'Failed to download certificate PDF');
      },
    });
  }

  private buildCalendar(sessions: OralSession[]): CalendarDay[] {
    const grouped = new Map<string, OralSession[]>();

    sessions.forEach((session) => {
      const date = new Date(session.scheduledAt);
      const key = date.toISOString().slice(0, 10);
      const list = grouped.get(key) ?? [];
      list.push(session);
      grouped.set(key, list);
    });

    return Array.from(grouped.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, daySessions]) => ({
        dateLabel: new Date(key).toLocaleDateString(),
        sessions: daySessions.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
      }));
  }

  private errorMessage(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      return (err.error?.message as string) || err.message || fallback;
    }
    return fallback;
  }
}
