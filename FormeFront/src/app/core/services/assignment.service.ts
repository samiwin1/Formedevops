import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../enviroments/environment';
import {
  CreateAssignmentRequest,
  CreateRescheduleRequest,
  GradeAssignmentRequest,
  IssuedCertification,
  OralAssignment,
  RescheduleResponse,
  EvaluatorSessionDto,
  GradeSubmissionRequest,
} from '../models/certification.models';

@Injectable({ providedIn: 'root' })
export class AssignmentService {
  private readonly baseApi = environment.certificationApiUrl ?? environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  assign(payload: CreateAssignmentRequest) {
    return this.http.post<OralAssignment>(`${this.baseApi}/oral-assignments`, payload);
  }

  grade(assignmentId: number, payload: GradeAssignmentRequest) {
    return this.http.post<OralAssignment>(`${this.baseApi}/oral-assignments/${assignmentId}/grade`, payload);
  }

  markNoShow(assignmentId: number) {
    return this.http.patch<OralAssignment>(`${this.baseApi}/oral-assignments/${assignmentId}/no-show`, {});
  }

  myAssignments() {
    return this.http.get<OralAssignment[]>(`${this.baseApi}/me/oral-assignments`);
  }

  evaluatorAssignments() {
    return this.http.get<OralAssignment[]>(`${this.baseApi}/evaluator/oral-assignments`);
  }

  requestReschedule(assignmentId: number, payload: CreateRescheduleRequest) {
    return this.http.post<RescheduleResponse>(`${this.baseApi}/oral-assignments/${assignmentId}/reschedule`, payload);
  }

  approveReschedule(rescheduleId: number, adminComment?: string) {
    let params = new HttpParams();
    if (adminComment) {
      params = params.set('adminComment', adminComment);
    }
    return this.http.patch<RescheduleResponse>(`${this.baseApi}/reschedule/${rescheduleId}/approve`, {}, { params });
  }

  rejectReschedule(rescheduleId: number, adminComment?: string, replacementSessionId?: number) {
    let params = new HttpParams();
    if (adminComment) {
      params = params.set('adminComment', adminComment);
    }
    if (replacementSessionId != null) {
      params = params.set('replacementSessionId', String(replacementSessionId));
    }
    return this.http.patch<RescheduleResponse>(`${this.baseApi}/reschedule/${rescheduleId}/reject`, {}, { params });
  }

  myIssuedCertifications() {
    return this.http.get<IssuedCertification[]>(`${this.baseApi}/me/certifications`);
  }

  issueCertificate(assignmentId: number) {
    return this.http.post<IssuedCertification>(`${this.baseApi}/certifications/issue/${assignmentId}`, {});
  }

  downloadCertificatePdf(id: number) {
    return this.http.get(`${this.baseApi}/me/certifications/${id}/pdf`, { responseType: 'blob' });
  }

  // Evaluator-specific methods
  getMyEvaluatorSessions() {
    return this.http.get<EvaluatorSessionDto[]>(
      `${this.baseApi}/evaluator/my-sessions`
    );
  }

  gradeAssignment(assignmentId: number, request: GradeSubmissionRequest) {
    return this.http.post<void>(
      `${this.baseApi}/evaluator/assignments/${assignmentId}/grade`,
      request
    );
  }

  markNoShowEvaluator(assignmentId: number) {
    return this.http.patch<void>(
      `${this.baseApi}/evaluator/assignments/${assignmentId}/no-show`,
      {}
    );
  }
}
