import { Injectable, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { forkJoin } from 'rxjs';
import {
  Certification,
  EligibleLearner,
  FailedOralAttempt,
  OralSession,
  PassedOralWithoutCertificate,
  PendingOralEvaluation,
} from '../models/certification.models';
import { CertificationService } from '../services/certification.service';
import { DashboardService } from '../services/dashboard.service';
import { IssuedCertificationService } from '../services/issued-certification.service';
import { OralSessionService } from '../services/oral-session.service';

@Injectable({ providedIn: 'root' })
export class CertificationDashboardStore {
  readonly certifications = signal<Certification[]>([]);
  readonly sessions = signal<OralSession[]>([]);
  readonly eligibleLearners = signal<EligibleLearner[]>([]);
  readonly pendingEvaluations = signal<PendingOralEvaluation[]>([]);
  readonly passedWithoutCertificate = signal<PassedOralWithoutCertificate[]>([]);
  readonly failedAfterTwoAttempts = signal<FailedOralAttempt[]>([]);
  readonly totalCertifications = signal(0);
  readonly plannedSessions = signal(0);
  readonly totalSessions = signal(0);
  readonly totalLearnersAssigned = signal(0);
  readonly issuedCertifications = signal(0);
  readonly pendingReschedules = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor(
    private readonly certificationService: CertificationService,
    private readonly oralSessionService: OralSessionService,
    private readonly dashboardService: DashboardService,
    private readonly issuedCertificationService: IssuedCertificationService
  ) {}

  loadAdminOverview(formationId: number): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      certifications: this.certificationService.list(),
      sessions: this.oralSessionService.list(),
      eligible: this.dashboardService.getEligibleLearnersForOral(formationId),
      pending: this.dashboardService.getPendingOralEvaluations(),
      passed: this.dashboardService.getPassedOralWithoutCertificate(),
      failed: this.dashboardService.getFailedAfterTwoAttempts(),
      pendingRescheduleList: this.dashboardService.getPendingRescheduleRequests().pipe(
        catchError(() => of([]))
      ),
      issuedList: this.issuedCertificationService.listForAdmin({ status: 'ISSUED' }).pipe(
        catchError(() => of([]))
      ),
      stats: this.dashboardService.getAdminStats().pipe(
        catchError(() => of(null))
      ),
    }).subscribe({
      next: ({ certifications, sessions, eligible, pending, passed, failed, pendingRescheduleList, issuedList, stats }) => {
        const plannedFromSessions = sessions.filter((s) => s.status === 'PLANNED').length;
        const assignedFromSessions = sessions.reduce((sum, s) => sum + (s.learnerCount ?? 0), 0);
        const statsAvailable = !!stats;

        this.certifications.set(certifications);
        this.sessions.set(sessions);
        this.totalSessions.set(sessions.length);
        this.totalCertifications.set(statsAvailable ? (stats.totalCertifications ?? certifications.length) : certifications.length);
        this.plannedSessions.set(statsAvailable ? (stats.oralSessionsPlanned ?? plannedFromSessions) : plannedFromSessions);
        this.totalLearnersAssigned.set(statsAvailable ? (stats.learnersAssigned ?? assignedFromSessions) : assignedFromSessions);
        this.issuedCertifications.set(statsAvailable ? (stats.issuedCertifications ?? issuedList.length) : issuedList.length);
        this.pendingReschedules.set(statsAvailable ? (stats.pendingReschedules ?? pendingRescheduleList.length) : pendingRescheduleList.length);
        this.eligibleLearners.set(eligible);
        this.pendingEvaluations.set(pending);
        this.passedWithoutCertificate.set(passed);
        this.failedAfterTwoAttempts.set(failed);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(this.toMessage(err, 'Failed to load dashboard data'));
        this.loading.set(false);
      },
    });
  }

  private toMessage(err: unknown, fallback: string): string {
    if (typeof err === 'object' && err && 'message' in err) {
      const message = (err as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }
    return fallback;
  }
}
