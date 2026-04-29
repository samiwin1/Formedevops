import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../enviroments/environment';
import { Evaluation, ResultEvaluation, EvaluationSubmitResponse, EvaluationHistoryItem } from '../models/formation.models';

@Injectable({ providedIn: 'root' })
export class EvaluationService {
  private readonly baseUrl = environment.formationApiUrl;

  constructor(private http: HttpClient) {}

  submitEvaluation(evaluationId: number, userId: number, answers: Record<number, number>): Observable<EvaluationSubmitResponse> {
    const answersMap: Record<string, number> = {};
    for (const [k, v] of Object.entries(answers)) {
      answersMap[String(k)] = v;
    }
    return this.http.post<EvaluationSubmitResponse>(`${this.baseUrl}/evaluations/${evaluationId}/submit`, {
      userId,
      answers: answersMap
    });
  }

  getByFormationId(formationId: number): Observable<Evaluation[]> {
    return this.http.get<Evaluation[]>(`${this.baseUrl}/evaluations/formation/${formationId}`);
  }

  getById(id: number): Observable<Evaluation> {
    return this.http.get<Evaluation>(`${this.baseUrl}/evaluations/${id}`);
  }

  create(evaluation: Evaluation): Observable<Evaluation> {
    return this.http.post<Evaluation>(`${this.baseUrl}/evaluations`, evaluation);
  }

  update(id: number, evaluation: Evaluation): Observable<Evaluation> {
    return this.http.put<Evaluation>(`${this.baseUrl}/evaluations/${id}`, evaluation);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/evaluations/${id}`);
  }

  submitResult(result: ResultEvaluation): Observable<ResultEvaluation> {
    return this.http.post<ResultEvaluation>(`${this.baseUrl}/result-evaluations`, result);
  }

  getUserResults(userId: number): Observable<ResultEvaluation[]> {
    return this.http.get<ResultEvaluation[]>(`${this.baseUrl}/result-evaluations/user/${userId}`);
  }

  getByEvaluationId(evaluationId: number): Observable<ResultEvaluation[]> {
    return this.http.get<ResultEvaluation[]>(`${this.baseUrl}/result-evaluations/evaluation/${evaluationId}`);
  }

  getHistory(userId: number, formationId?: number): Observable<EvaluationHistoryItem[]> {
    let params = `userId=${userId}`;
    if (formationId != null) params += `&formationId=${formationId}`;
    return this.http.get<EvaluationHistoryItem[]>(`${this.baseUrl}/evaluations/history?${params}`);
  }
}
