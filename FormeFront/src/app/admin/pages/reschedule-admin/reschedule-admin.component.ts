import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { switchMap } from 'rxjs';
import { OralSession, RescheduleAdminItem } from '../../../core/models/certification.models';
import { AssignmentService } from '../../../core/services/assignment.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { OralSessionService } from '../../../core/services/oral-session.service';

@Component({
  standalone: true,
  selector: 'app-reschedule-admin',
  imports: [CommonModule, FormsModule],
  templateUrl: './reschedule-admin.component.html',
  styleUrl: './reschedule-admin.component.css',
})
export class RescheduleAdminComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly assignmentService = inject(AssignmentService);
  private readonly oralSessionService = inject(OralSessionService);

  requests: RescheduleAdminItem[] = [];
  sessions: OralSession[] = [];
  loading = false;
  error: string | null = null;
  success: string | null = null;
  processingId: number | null = null;
  adminComment = '';
  commentByRequest: Record<number, string> = {};
  replacementSessionByRequest: Record<number, number | null> = {};
  replacementDatetimeByRequest: Record<number, string> = {};
  statusFilter: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' = 'ALL';

  ngOnInit(): void {
    this.loadSessions();
    this.loadRequests();
  }

  loadSessions(): void {
    this.oralSessionService.list().subscribe({
      next: (sessions) => {
        this.sessions = sessions;
      },
      error: () => {
        this.sessions = [];
      },
    });
  }

  loadRequests(): void {
    this.loading = true;
    this.error = null;
    const status = this.statusFilter === 'ALL' ? undefined : this.statusFilter;
    this.dashboardService.getRescheduleRequests(status).subscribe({
      next: (list) => {
        this.requests = list;
        this.loading = false;
      },
      error: (err: unknown) => {
        this.error = this.errMessage(err);
        this.loading = false;
      },
    });
  }

  approve(item: RescheduleAdminItem): void {
    this.processingId = item.id;
    this.error = null;
    this.success = null;
    const comment = this.commentByRequest[item.id] || this.adminComment || undefined;
    this.assignmentService.approveReschedule(item.id, comment).subscribe({
      next: () => {
        this.success = 'Reschedule approved.';
        delete this.commentByRequest[item.id];
        this.processingId = null;
        this.loadRequests();
      },
      error: (err: unknown) => {
        this.error = this.errMessage(err);
        this.processingId = null;
      },
    });
  }

  reject(item: RescheduleAdminItem): void {
    this.processingId = item.id;
    this.error = null;
    this.success = null;
    const comment = this.commentByRequest[item.id] || this.adminComment || undefined;
    const replacementSessionId = this.replacementSessionByRequest[item.id] ?? undefined;
    const replacementDatetime = (this.replacementDatetimeByRequest[item.id] || '').trim();

    if (replacementSessionId == null && replacementDatetime) {
      const currentSession = this.sessions.find((session) => session.id === item.sessionId);
      if (!currentSession) {
        this.error = 'Current session details not loaded. Please refresh and try again.';
        this.processingId = null;
        return;
      }

      this.oralSessionService
        .create({
          certificationId: currentSession.certificationId,
          title: `Replacement - ${currentSession.title}`,
          scheduledAt: replacementDatetime,
          durationMinutes: currentSession.durationMinutes,
          meetingProvider: currentSession.meetingProvider,
          meetingLink: currentSession.meetingLink,
          evaluatorId: currentSession.evaluatorId,
        })
        .pipe(switchMap((created) => this.assignmentService.rejectReschedule(item.id, comment, created.id)))
        .subscribe({
          next: () => {
            this.success = 'Reschedule rejected with a new replacement session.';
            delete this.commentByRequest[item.id];
            delete this.replacementSessionByRequest[item.id];
            delete this.replacementDatetimeByRequest[item.id];
            this.processingId = null;
            this.loadSessions();
            this.loadRequests();
          },
          error: (err: unknown) => {
            this.error = this.errMessage(err);
            this.processingId = null;
          },
        });
      return;
    }

    this.assignmentService.rejectReschedule(item.id, comment, replacementSessionId).subscribe({
      next: () => {
        this.success = 'Reschedule rejected.';
        delete this.commentByRequest[item.id];
        delete this.replacementSessionByRequest[item.id];
        delete this.replacementDatetimeByRequest[item.id];
        this.processingId = null;
        this.loadRequests();
      },
      error: (err: unknown) => {
        this.error = this.errMessage(err);
        this.processingId = null;
      },
    });
  }

  onFilterChange(): void {
    this.loadRequests();
  }

  isPending(item: RescheduleAdminItem): boolean {
    return item.status === 'PENDING';
  }

  replacementOptions(item: RescheduleAdminItem): OralSession[] {
    const current = this.sessions.find((session) => session.id === item.sessionId);
    const certificationId = current?.certificationId;
    const now = new Date().getTime();
    return this.sessions.filter((session) => {
      if (session.id === item.sessionId) {
        return false;
      }
      if (session.status !== 'PLANNED') {
        return false;
      }
      if (certificationId != null && session.certificationId !== certificationId) {
        return false;
      }
      const dateValue = new Date(session.scheduledAt).getTime();
      return Number.isFinite(dateValue) && dateValue > now;
    });
  }

  private errMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      return (err.error?.message as string) || err.message || 'Request failed';
    }
    return 'Request failed';
  }
}
