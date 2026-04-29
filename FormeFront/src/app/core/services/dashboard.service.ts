import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../enviroments/environment';
import {
  AdminDashboardStats,
  EligibleLearner,
  EvaluatorOverview,
  FailedOralAttempt,
  MyCertificationStatus,
  MyExamStatus,
  PassedOralWithoutCertificate,
  PendingOralEvaluation,
  RescheduleAdminItem,
  RescheduleResponse,
} from '../models/certification.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly baseApi = environment.certificationApiUrl ?? environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getEligibleLearnersForOral(formationId: number) {
    const params = new HttpParams().set('formationId', String(formationId));
    return this.http.get<EligibleLearner[]>(`${this.baseApi}/admin/oral/eligible`, { params });
  }

  getPendingOralEvaluations() {
    return this.http.get<PendingOralEvaluation[]>(`${this.baseApi}/admin/oral/pending`);
  }

  getPassedOralWithoutCertificate() {
    return this.http.get<PassedOralWithoutCertificate[]>(`${this.baseApi}/admin/oral/passed`);
  }

  getFailedAfterTwoAttempts() {
    return this.http.get<FailedOralAttempt[]>(`${this.baseApi}/admin/oral/failed`);
  }

  getAdminStats() {
    return this.http.get<AdminDashboardStats>(`${this.baseApi}/admin/oral/stats`);
  }

  getPendingRescheduleRequests() {
    return this.http.get<RescheduleAdminItem[]>(`${this.baseApi}/admin/reschedule/pending`);
  }

  getRescheduleRequests(status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<RescheduleAdminItem[]>(`${this.baseApi}/admin/reschedule`, { params });
  }

  getMyRescheduleRequests() {
    return this.http.get<RescheduleResponse[]>(`${this.baseApi}/me/reschedule`);
  }

  getMyExamStatus(formationId?: number) {
    const params = formationId != null ? new HttpParams().set('formationId', String(formationId)) : undefined;
    return this.http.get<MyExamStatus>(`${this.baseApi}/me/exam-status`, { params });
  }

  getMyCertificationStatus(formationId?: number) {
    const params = formationId != null ? new HttpParams().set('formationId', String(formationId)) : undefined;
    return this.http.get<MyCertificationStatus>(`${this.baseApi}/me/certification-status`, { params });
  }

  getEvaluatorOverview() {
    return this.http.get<EvaluatorOverview>(`${this.baseApi}/me/evaluator-overview`);
  }
}
