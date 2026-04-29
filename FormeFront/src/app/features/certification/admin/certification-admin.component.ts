import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  Certification,
  CreateAssignmentRequest,
  CreateCertificationRequest,
  CreateOralSessionRequest,
  MeetingProvider,
  OralSession,
  OralSessionStatus,
  RescheduleAdminItem,
  UpdateCertificationRequest,
  UpdateOralSessionRequest,
} from '../../../core/models/certification.models';
import { AssignmentService } from '../../../core/services/assignment.service';
import { CertificationService } from '../../../core/services/certification.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { FormationDirectoryService, FormationOption } from '../../../core/services/formation-directory.service';
import { OralSessionService } from '../../../core/services/oral-session.service';
import { UserDirectoryEntry, UserDirectoryService } from '../../../core/services/user-directory.service';
import { catchError, forkJoin, map, of } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-certification-admin',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './certification-admin.component.html',
  styleUrls: ['./certification-admin.component.css'],
})
export class CertificationAdminComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly certificationService = inject(CertificationService);
  private readonly oralSessionService = inject(OralSessionService);
  private readonly assignmentService = inject(AssignmentService);
  private readonly dashboardService = inject(DashboardService);
  private readonly formationDirectory = inject(FormationDirectoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly userDirectory = inject(UserDirectoryService);

  certifications: Certification[] = [];
  sessions: OralSession[] = [];
  loading = false;
  error: string | null = null;
  success: string | null = null;
  certificationSearch = '';
  sessionSearch = '';
  certificationStatusFilter: 'ALL' | Certification['status'] = 'ALL';
  sessionStatusFilter: 'ALL' | OralSession['status'] = 'ALL';
  certificationPage = 1;
  sessionPage = 1;
  readonly pageSize = 6;

  editingCertificationId: number | null = null;
  editingSessionId: number | null = null;
  showCertificationForm = false;
  showOralForm = false;
  showAssignLearnerModal = false;
  showRescheduleModal = false;
  assignmentSubmitAttempted = false;
  assignmentSaving = false;
  mode: 'certification' | 'oral' = 'certification';
  userNames: Record<number, string> = {};
  directoryEntries: UserDirectoryEntry[] = [];
  formationOptions: FormationOption[] = [];
  pendingRescheduleRequests: RescheduleAdminItem[] = [];
  rescheduleLoading = false;
  processingRescheduleId: number | null = null;
  rescheduleCommentById: Record<number, string> = {};
  replacementSessionByRequestId: Record<number, number | null> = {};
  private assignPrefillApplied = false;

  meetingProviders: MeetingProvider[] = ['MEET', 'TEAMS'];
  sessionStatuses: OralSessionStatus[] = ['PLANNED', 'DONE', 'CANCELED'];
  assignmentStatuses = ['ASSIGNED', 'RESCHEDULE_REQUESTED', 'RESCHEDULED', 'COMPLETED'];

  certificationForm = this.fb.group({
    title: ['', Validators.required],
    domain: [''],
    provider: [''],
    level: [''],
    validityMonths: [12, [Validators.required, Validators.min(1)]],
    thresholdFinal: [50, [Validators.required, Validators.min(0), Validators.max(100)]],
    weightWritten: [0.5, [Validators.required, Validators.min(0), Validators.max(1)]],
    weightOral: [0.5, [Validators.required, Validators.min(0), Validators.max(1)]],
  });

  sessionForm = this.fb.group({
    certificationId: [null as number | null, Validators.required],
    title: ['', Validators.required],
    scheduledAt: ['', Validators.required],
    durationMinutes: [30, [Validators.required, Validators.min(1)]],
    meetingProvider: ['MEET' as MeetingProvider, Validators.required],
    meetingLink: ['', Validators.required],
    evaluatorId: [null as number | null, Validators.required],
    status: ['PLANNED' as OralSessionStatus, Validators.required],
  });

  assignmentForm = this.fb.group({
    oralSessionId: [null as number | null, Validators.required],
    learners: this.fb.array<FormGroup<{ learnerId: FormControl<number | null> }>>([]),
    formationId: [null as number | null, [Validators.required, Validators.min(1)]],
    assignmentStatus: ['ASSIGNED'],
    reassignedEvaluatorId: [null as number | null],
    evaluatorComment: [''],
  });

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      const configuredMode = data['mode'] as 'certification' | 'oral' | undefined;
      this.mode = configuredMode ?? 'certification';
      this.tryPrefillAssignFromQuery();
    });
    this.refresh();
    this.loadDirectoryEntries();
    this.loadFormationOptions();
    this.loadPendingRescheduleRequests();

    this.assignmentForm.controls.reassignedEvaluatorId.valueChanges.subscribe((evaluatorId) => {
      if (evaluatorId) {
        this.resolveUserNames([evaluatorId]);
      }
    });

    this.sessionForm.controls.evaluatorId.valueChanges.subscribe((evaluatorId) => {
      if (evaluatorId) {
        this.resolveUserNames([evaluatorId]);
      }
    });

    this.route.queryParamMap.subscribe(() => this.tryPrefillAssignFromQuery());
  }

  get learnerOptions(): UserDirectoryEntry[] {
    return this.directoryEntries.filter((entry) => this.isLearnerProfession(entry.profession));
  }

  get evaluatorOptions(): UserDirectoryEntry[] {
    return this.directoryEntries.filter((entry) => this.isEvaluatorProfession(entry.profession));
  }

  get learnersArray(): FormArray<FormGroup<{ learnerId: FormControl<number | null> }>> {
    return this.assignmentForm.controls.learners;
  }

  isCertificationMode(): boolean {
    return this.mode === 'certification';
  }

  isOralMode(): boolean {
    return this.mode === 'oral';
  }

  get plannedSessionsCount(): number {
    return this.sessions.filter((session) => session.status === 'PLANNED').length;
  }

  get filteredCertifications(): Certification[] {
    const q = this.certificationSearch.trim().toLowerCase();
    return this.certifications.filter((c) => {
      const statusMatch = this.certificationStatusFilter === 'ALL' || c.status === this.certificationStatusFilter;
      const textMatch = !q ||
      [c.title, c.domain, c.level, c.provider, c.status]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
      return statusMatch && textMatch;
    });
  }

  get certificationTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredCertifications.length / this.pageSize));
  }

  get pagedCertifications(): Certification[] {
    const page = Math.min(this.certificationPage, this.certificationTotalPages);
    const start = (page - 1) * this.pageSize;
    return this.filteredCertifications.slice(start, start + this.pageSize);
  }

  get filteredSessions(): OralSession[] {
    const q = this.sessionSearch.trim().toLowerCase();
    return this.sessions.filter((s) => {
      const statusMatch = this.sessionStatusFilter === 'ALL' || s.status === this.sessionStatusFilter;
      const textMatch = !q ||
      [s.title, s.status, s.meetingProvider, s.certificationTitle, this.displayUserName(s.evaluatorId, 'Evaluator')]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
      return statusMatch && textMatch;
    });
  }

  get sessionTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredSessions.length / this.pageSize));
  }

  get pagedSessions(): OralSession[] {
    const page = Math.min(this.sessionPage, this.sessionTotalPages);
    const start = (page - 1) * this.pageSize;
    return this.filteredSessions.slice(start, start + this.pageSize);
  }

  refresh(): void {
    this.loading = true;
    this.error = null;

    this.certificationService.list().subscribe({
      next: (certifications: Certification[]) => {
        this.certifications = certifications;
        this.oralSessionService.list().subscribe({
          next: (sessions: OralSession[]) => {
            this.sessions = sessions;
            this.certificationPage = 1;
            this.sessionPage = 1;
            this.resolveUserNames(sessions.map((session) => session.evaluatorId));
            this.loadPendingRescheduleRequests();
            this.loading = false;
          },
          error: (err: unknown) => {
            this.loading = false;
            this.error = this.errorMessage(err, 'Failed to load oral sessions');
          },
        });
      },
      error: (err: unknown) => {
        this.loading = false;
        const msg = this.errorMessage(err, 'Failed to load certifications');
        this.error = msg + (this.isCertificationApiUnreachable(err) ? ' Start certification-service (port 8090) and, if using port 8080, ensure /api proxies to it.' : '');
      },
    });
  }

  submitCertification(): void {
    if (this.certificationForm.invalid) {
      this.certificationForm.markAllAsTouched();
      return;
    }

    const raw = this.certificationForm.value;
    const parseNum = (v: unknown, fallback: number): number => {
      if (v == null) return fallback;
      if (typeof v === 'number' && !Number.isNaN(v)) return v;
      const s = String(v).trim().replace(',', '.');
      const n = Number(s);
      return Number.isFinite(n) ? n : fallback;
    };
    const weightWritten = Math.round(parseNum(raw.weightWritten, 0.5) * 100) / 100;
    const weightOral = Math.round(parseNum(raw.weightOral, 0.5) * 100) / 100;
    const payload: CreateCertificationRequest = {
      title: String(raw.title ?? '').trim(),
      domain: raw.domain ? String(raw.domain).trim() || undefined : undefined,
      provider: raw.provider ? String(raw.provider).trim() || undefined : undefined,
      level: raw.level ? String(raw.level).trim() || undefined : undefined,
      validityMonths: parseNum(raw.validityMonths, 12),
      thresholdFinal: parseNum(raw.thresholdFinal, 50),
      weightWritten,
      weightOral,
    };

    const action = this.editingCertificationId
      ? this.certificationService.update(this.editingCertificationId, payload as UpdateCertificationRequest)
      : this.certificationService.create(payload);

    action.subscribe({
      next: () => {
        this.success = this.editingCertificationId ? 'Certification updated' : 'Certification created';
        this.editingCertificationId = null;
        this.showCertificationForm = false;
        this.certificationForm.reset({
          validityMonths: 12,
          thresholdFinal: 50,
          weightWritten: 0.5,
          weightOral: 0.5,
        });
        this.refresh();
      },
      error: (err: unknown) => {
        const msg = this.errorMessage(err, 'Failed to save certification');
        this.error = msg + (this.isCertificationApiUnreachable(err) ? ' Ensure certification-service (port 8090) is running.' : '');
      },
    });
  }

  editCertification(certification: Certification): void {
    this.editingCertificationId = certification.id;
    this.showCertificationForm = true;
    this.certificationForm.patchValue({ ...certification });
  }

  startCreateCertification(): void {
    this.editingCertificationId = null;
    this.showCertificationForm = true;
    this.certificationForm.reset({
      validityMonths: 12,
      thresholdFinal: 50,
      weightWritten: 0.5,
      weightOral: 0.5,
    });
  }

  cancelCertificationEdit(): void {
    this.editingCertificationId = null;
    this.showCertificationForm = false;
    this.certificationForm.reset({
      validityMonths: 12,
      thresholdFinal: 50,
      weightWritten: 0.5,
      weightOral: 0.5,
    });
  }

  onCertificationSearch(): void {
    this.certificationPage = 1;
  }

  onCertificationFilter(): void {
    this.certificationPage = 1;
  }

  onSessionSearch(): void {
    this.sessionPage = 1;
  }

  onSessionFilter(): void {
    this.sessionPage = 1;
  }

  previousCertificationPage(): void {
    this.certificationPage = Math.max(1, this.certificationPage - 1);
  }

  nextCertificationPage(): void {
    this.certificationPage = Math.min(this.certificationTotalPages, this.certificationPage + 1);
  }

  previousSessionPage(): void {
    this.sessionPage = Math.max(1, this.sessionPage - 1);
  }

  nextSessionPage(): void {
    this.sessionPage = Math.min(this.sessionTotalPages, this.sessionPage + 1);
  }

  publishCertification(id: number): void {
    this.certificationService.publish(id).subscribe({
      next: () => {
        this.success = 'Certification published';
        this.refresh();
      },
      error: (err: unknown) => {
        this.error = this.errorMessage(err, 'Failed to publish certification');
      },
    });
  }

  submitSession(): void {
    if (this.sessionForm.invalid) {
      this.sessionForm.markAllAsTouched();
      return;
    }

    const basePayload: CreateOralSessionRequest = {
      certificationId: this.sessionForm.value.certificationId!,
      title: this.sessionForm.value.title!,
      scheduledAt: this.sessionForm.value.scheduledAt!,
      durationMinutes: this.sessionForm.value.durationMinutes!,
      meetingProvider: this.sessionForm.value.meetingProvider!,
      meetingLink: this.sessionForm.value.meetingLink!,
      evaluatorId: this.sessionForm.value.evaluatorId!,
    };

    const action = this.editingSessionId
      ? this.oralSessionService.update(this.editingSessionId, {
          ...basePayload,
          status: this.sessionForm.value.status!,
        } as UpdateOralSessionRequest)
      : this.oralSessionService.create(basePayload);

    action.subscribe({
      next: () => {
        this.success = this.editingSessionId ? 'Session updated' : 'Session created';
        this.editingSessionId = null;
        this.showOralForm = false;
        this.sessionForm.reset({
          meetingProvider: 'MEET',
          durationMinutes: 30,
          status: 'PLANNED',
        });
        this.refresh();
      },
      error: (err: unknown) => {
        this.error = this.errorMessage(err, 'Failed to save oral session');
      },
    });
  }

  editSession(session: OralSession): void {
    this.editingSessionId = session.id;
    this.showOralForm = true;
    this.sessionForm.patchValue({ ...session, scheduledAt: this.asDateInput(session.scheduledAt) });
  }

  startCreateOralSession(): void {
    this.editingSessionId = null;
    this.showOralForm = true;
    this.sessionForm.reset({
      meetingProvider: 'MEET',
      durationMinutes: 30,
      status: 'PLANNED',
    });
  }

  cancelOralEdit(): void {
    this.editingSessionId = null;
    this.showOralForm = false;
    this.sessionForm.reset({
      meetingProvider: 'MEET',
      durationMinutes: 30,
      status: 'PLANNED',
    });
  }

  deleteSession(session: OralSession): void {
    const shouldDelete = window.confirm(`Delete oral session #${session.id}?`);
    if (!shouldDelete) {
      return;
    }

    this.oralSessionService.delete(session.id).subscribe({
      next: () => {
        this.success = 'Session deleted';
        this.refresh();
      },
      error: (err: unknown) => {
        const deleteMessage = this.errorMessage(err, 'Failed to delete oral session');
        const fallbackPayload: UpdateOralSessionRequest = {
          certificationId: session.certificationId,
          title: session.title,
          scheduledAt: session.scheduledAt,
          durationMinutes: session.durationMinutes,
          meetingProvider: session.meetingProvider,
          meetingLink: session.meetingLink,
          evaluatorId: session.evaluatorId,
          status: 'CANCELED',
        };

        this.oralSessionService.update(session.id, fallbackPayload).subscribe({
          next: () => {
            this.success = 'Session cannot be hard-deleted, so it was canceled instead.';
            this.refresh();
          },
          error: (updateErr: unknown) => {
            const updateMessage = this.errorMessage(updateErr, 'Failed to cancel oral session');
            this.error = `${deleteMessage}. Fallback cancel failed: ${updateMessage}`;
          },
        });
      },
    });
  }

  openReassignModal(session: OralSession): void {
    this.openAssignLearnerModal(session.id);
    this.assignmentForm.patchValue({
      assignmentStatus: 'RESCHEDULED',
      reassignedEvaluatorId: session.evaluatorId,
    });
    this.success = 'Reassign mode enabled. Select learner(s), optional evaluator change, then save.';
  }

  openAssignLearnerModal(defaultSessionId?: number): void {
    this.error = null;
    this.success = null;
    this.assignmentSaving = false;
    if (defaultSessionId) {
      const session = this.sessions.find((item) => item.id === defaultSessionId);
      if (session) {
        this.resolveUserNames([session.evaluatorId]);
      }
    }

    this.showAssignLearnerModal = true;
    this.loadDirectoryEntries();
    this.learnersArray.clear();
    this.addLearnerRow();
    this.assignmentForm.reset({
      oralSessionId: defaultSessionId ?? null,
      formationId: null,
      assignmentStatus: 'ASSIGNED',
      reassignedEvaluatorId: defaultSessionId
        ? this.sessions.find((session) => session.id === defaultSessionId)?.evaluatorId ?? null
        : null,
      evaluatorComment: '',
    });
  }

  closeAssignLearnerModal(): void {
    this.showAssignLearnerModal = false;
    this.assignmentSubmitAttempted = false;
    this.assignmentSaving = false;
  }

  openRescheduleModal(): void {
    this.showRescheduleModal = true;
    this.loadPendingRescheduleRequests();
  }

  closeRescheduleModal(): void {
    this.showRescheduleModal = false;
  }

  addLearnerRow(initialLearnerId: number | null = null): void {
    const row = this.fb.group({
      learnerId: [initialLearnerId, Validators.required],
    });
    row.controls.learnerId.valueChanges.subscribe((learnerId) => {
      if (learnerId) {
        this.resolveUserNames([learnerId]);
      }
    });
    this.learnersArray.push(row);
  }

  removeLearnerRow(index: number): void {
    if (this.learnersArray.length <= 1) {
      return;
    }
    this.learnersArray.removeAt(index);
  }

  hasDuplicateLearnerAt(index: number): boolean {
    const current = Number(this.learnersArray.at(index)?.controls.learnerId.value);
    if (!Number.isFinite(current) || current <= 0) {
      return false;
    }
    let occurrences = 0;
    for (let i = 0; i < this.learnersArray.length; i++) {
      const value = Number(this.learnersArray.at(i).controls.learnerId.value);
      if (Number.isFinite(value) && value === current) {
        occurrences++;
        if (occurrences > 1) {
          return true;
        }
      }
    }
    return false;
  }

  submitAssignment(): void {
    this.assignmentSubmitAttempted = true;
    if (this.assignmentForm.invalid) {
      this.assignmentForm.markAllAsTouched();
      this.error = 'Please complete required fields before saving assignment.';
      return;
    }

    const formationId = Number(this.assignmentForm.value.formationId);
    if (!Number.isFinite(formationId) || formationId <= 0) {
      this.error = 'Please select a valid formation.';
      return;
    }

    const learnerIds = this.learnersArray.controls
      .map((row) => Number(row.controls.learnerId.value))
      .filter((id) => Number.isFinite(id) && id > 0);
    const uniqueLearnerIds = Array.from(new Set(learnerIds));
    if (!uniqueLearnerIds.length) {
      this.error = 'Please select at least one learner.';
      return;
    }
    if (uniqueLearnerIds.length !== learnerIds.length) {
      this.error = 'Duplicate learners selected. Please keep each learner only once.';
      return;
    }
    const evaluatorIds = uniqueLearnerIds.filter((learnerId) => {
      const entry = this.directoryEntries.find((row) => row.userId === learnerId);
      return this.isEvaluatorProfession(entry?.profession);
    });
    if (evaluatorIds.length > 0) {
      this.error = `Invalid learner selection. User(s) ${evaluatorIds.join(', ')} are evaluators, not learners.`;
      return;
    }

    this.assignmentSaving = true;
    const oralSessionId = this.assignmentForm.value.oralSessionId!;
    const requests = uniqueLearnerIds.map((learnerId) =>
      this.assignmentService.assign({
        oralSessionId,
        learnerId,
        formationId,
      } as CreateAssignmentRequest).pipe(
        map(() => ({ learnerId, ok: true as const })),
        catchError((err) => {
          console.error('Assignment request failed', {
            learnerId,
            status: err instanceof HttpErrorResponse ? err.status : undefined,
            error: err instanceof HttpErrorResponse ? err.error : err,
          });
          return of({
            learnerId,
            ok: false as const,
            message: this.errorMessage(err, `Failed for learner #${learnerId}`),
          });
        })
      )
    );

    forkJoin(requests).subscribe({
      next: (results) => {
        this.assignmentSaving = false;
        const failed = results.filter((r) => !r.ok);
        const succeeded = results.filter((r) => r.ok);

        if (succeeded.length > 0) {
          this.success = `${succeeded.length} learner(s) assigned successfully.`;
          this.refresh();
        }

        if (failed.length > 0) {
          const details = failed.slice(0, 3).map((f) => f.message).join(' | ');
          this.error = `${failed.length} assignment(s) failed. ${details}`;
          return;
        }

        this.closeAssignLearnerModal();
        this.learnersArray.clear();
        this.assignmentSubmitAttempted = false;
      },
      error: (err: unknown) => {
        this.assignmentSaving = false;
        this.error = this.errorMessage(err, 'Failed to assign one or more learners');
      },
    });
  }

  approveReschedule(item: RescheduleAdminItem): void {
    this.processingRescheduleId = item.id;
    this.assignmentService
      .approveReschedule(item.id, this.rescheduleCommentById[item.id] || undefined)
      .subscribe({
        next: () => {
          this.success = 'Reschedule request approved';
          delete this.rescheduleCommentById[item.id];
          this.processingRescheduleId = null;
          this.loadPendingRescheduleRequests();
          this.refresh();
        },
        error: (err: unknown) => {
          this.processingRescheduleId = null;
          this.error = this.errorMessage(err, 'Failed to approve request');
        },
      });
  }

  rejectReschedule(item: RescheduleAdminItem): void {
    this.processingRescheduleId = item.id;
    this.assignmentService
      .rejectReschedule(
        item.id,
        this.rescheduleCommentById[item.id] || undefined,
        this.replacementSessionByRequestId[item.id] ?? undefined
      )
      .subscribe({
        next: () => {
          this.success = 'Reschedule request rejected';
          delete this.rescheduleCommentById[item.id];
          delete this.replacementSessionByRequestId[item.id];
          this.processingRescheduleId = null;
          this.loadPendingRescheduleRequests();
        },
        error: (err: unknown) => {
          this.processingRescheduleId = null;
          this.error = this.errorMessage(err, 'Failed to reject request');
        },
      });
  }

  loadPendingRescheduleRequests(): void {
    if (!this.isOralMode()) {
      return;
    }
    this.rescheduleLoading = true;
    this.dashboardService.getPendingRescheduleRequests().subscribe({
      next: (requests) => {
        this.pendingRescheduleRequests = requests;
        const validIds = new Set(requests.map((r) => r.id));
        Object.keys(this.replacementSessionByRequestId).forEach((rawId) => {
          const id = Number(rawId);
          if (!validIds.has(id)) {
            delete this.replacementSessionByRequestId[id];
            delete this.rescheduleCommentById[id];
          }
        });
        this.rescheduleLoading = false;
      },
      error: (err: unknown) => {
        this.rescheduleLoading = false;
        this.error = this.errorMessage(err, 'Failed to load pending reschedule requests');
      },
    });
  }

  replacementOptionsFor(item: RescheduleAdminItem): OralSession[] {
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
      const scheduled = new Date(session.scheduledAt).getTime();
      return Number.isFinite(scheduled) && scheduled > now;
    });
  }

  private isCertificationApiUnreachable(err: unknown): boolean {
    if (err instanceof HttpErrorResponse) {
      const s = err.status;
      return s === 0 || s === 502 || s === 503 || s === 504;
    }
    return false;
  }

  private errorMessage(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      if (typeof err.error === 'string' && err.error.trim().length > 0) {
        const raw = err.error.trim();
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed.message === 'string' && parsed.message.trim().length > 0) {
            return parsed.message.trim();
          }
        } catch {
          // ignore JSON parsing failure and return raw string
        }
        return raw;
      }
      if (err.error && typeof err.error === 'object') {
        const message = (err.error as { message?: unknown }).message;
        if (typeof message === 'string' && message.trim().length > 0) {
          return message.trim();
        }
      }
      if (err.status === 400) {
        return 'Assignment rejected by backend. Check learner eligibility, formationId, and selected oral session.';
      }
      if (err.status === 403) {
        const msg = err.error && typeof err.error === 'object' && typeof (err.error as { message?: string }).message === 'string'
          ? (err.error as { message: string }).message
          : null;
        return msg || 'Access denied. Log in with an account that has the Admin role to add or manage certifications. If you are an admin, ensure certification-service uses the same JWT secret as user-service.';
      }
      return err.message || fallback;
    }
    return fallback;
  }

  private asDateInput(value: string): string {
    return value ? value.slice(0, 16) : '';
  }

  displayUserName(userId: number, role: 'Learner' | 'Evaluator' | 'User' = 'User'): string {
    if (!Number.isFinite(userId) || userId <= 0) {
      return '-';
    }

    return this.userNames[userId] || `${role} #${userId}`;
  }

  private resolveUserNames(userIds: number[]): void {
    this.userDirectory.getNames(userIds).subscribe((names) => {
      this.userNames = { ...this.userNames, ...names };
    });
  }

  private loadDirectoryEntries(): void {
    this.userDirectory.getDirectoryEntries().subscribe((entries) => {
      this.directoryEntries = entries;
      const ids = entries.map((entry) => entry.userId);
      if (ids.length) {
        this.resolveUserNames(ids);
      }
    });
  }

  private loadFormationOptions(): void {
    this.formationDirectory.getFormationOptions().subscribe((formations) => {
      this.formationOptions = formations;
    });
  }

  private isLearnerProfession(profession?: string | null): boolean {
    const value = (profession ?? '').toUpperCase().trim();
    if (!value) {
      return true;
    }
    const blockedProfessions = new Set(['EVALUATOR', 'ADMIN', 'SUPER_ADMIN']);
    return !blockedProfessions.has(value);
  }

  private isEvaluatorProfession(profession?: string | null): boolean {
    return (profession ?? '').toUpperCase() === 'EVALUATOR';
  }

  private tryPrefillAssignFromQuery(): void {
    if (!this.isOralMode() || this.assignPrefillApplied) {
      return;
    }

    const learnerId = Number(this.route.snapshot.queryParamMap.get('learnerId'));
    if (!Number.isFinite(learnerId) || learnerId <= 0) {
      return;
    }

    const formationId = Number(this.route.snapshot.queryParamMap.get('formationId'));
    const sessionId = Number(this.route.snapshot.queryParamMap.get('sessionId'));

    this.openAssignLearnerModal(Number.isFinite(sessionId) && sessionId > 0 ? sessionId : undefined);
    if (this.learnersArray.length > 0) {
      this.learnersArray.at(0).patchValue({ learnerId });
    }
    if (Number.isFinite(formationId) && formationId > 0) {
      this.assignmentForm.patchValue({ formationId });
    }
    this.assignPrefillApplied = true;
  }
}
