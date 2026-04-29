import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/environment';
import {
  FeedbackResponse,
  PendingFeedbackDto,
  SessionFeedbackSummaryDto,
  SubmitFeedbackRequest,
} from '../models/certification.models';

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.certificationApiUrl;

  submitFeedback(request: SubmitFeedbackRequest): Observable<FeedbackResponse> {
    return this.http.post<FeedbackResponse>(`${this.api}/me/feedback`, request);
  }

  checkPendingFeedback(): Observable<PendingFeedbackDto> {
    return this.http.get<PendingFeedbackDto>(`${this.api}/me/feedback/pending`);
  }

  getSessionFeedbackSummary(sessionId: number): Observable<SessionFeedbackSummaryDto> {
    return this.http.get<SessionFeedbackSummaryDto>(
      `${this.api}/admin/feedback/session/${sessionId}/summary`
    );
  }

  getEvaluatorAvgRating(evaluatorId: number): Observable<{ avgRating: number }> {
    return this.http.get<{ avgRating: number }>(
      `${this.api}/admin/feedback/evaluator/${evaluatorId}/avg-rating`
    );
  }
}

