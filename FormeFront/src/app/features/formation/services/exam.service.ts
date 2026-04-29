import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../enviroments/environment';
import { Examen, ResultExamen, ExamHistoryItem } from '../models/formation.models';

@Injectable({ providedIn: 'root' })
export class ExamService {
  private readonly baseUrl = environment.formationApiUrl;

  constructor(private http: HttpClient) {}

  getByFormationId(formationId: number): Observable<Examen | null> {
    return this.http.get<Examen>(`${this.baseUrl}/examens/formation/${formationId}`).pipe(
      catchError(() => of(null))
    );
  }

  getById(id: number): Observable<Examen> {
    return this.http.get<Examen>(`${this.baseUrl}/examens/${id}`);
  }

  create(exam: Examen): Observable<Examen> {
    return this.http.post<Examen>(`${this.baseUrl}/examens`, exam);
  }

  update(id: number, exam: Examen): Observable<Examen> {
    return this.http.put<Examen>(`${this.baseUrl}/examens/${id}`, exam);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/examens/${id}`);
  }

  submitResult(result: ResultExamen): Observable<ResultExamen> {
    return this.http.post<ResultExamen>(`${this.baseUrl}/result-examens`, result);
  }

  getUserResults(userId: number): Observable<ResultExamen[]> {
    return this.http.get<ResultExamen[]>(`${this.baseUrl}/result-examens/user/${userId}`);
  }

  getByExamenId(examenId: number): Observable<ResultExamen[]> {
    return this.http.get<ResultExamen[]>(`${this.baseUrl}/result-examens/examen/${examenId}`);
  }

  getHistory(userId: number, formationId?: number): Observable<ExamHistoryItem[]> {
    let params = `userId=${userId}`;
    if (formationId != null) params += `&formationId=${formationId}`;
    return this.http.get<ExamHistoryItem[]>(`${this.baseUrl}/examens/history?${params}`);
  }

  startExam(examenId: number, userId: number): Observable<ResultExamen> {
    return this.http.post<ResultExamen>(`${this.baseUrl}/examens/${examenId}/start?userId=${userId}`, {});
  }

  saveAnswer(resultExamenId: number, answers: Record<string, number>): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/result-examens/${resultExamenId}/save-answer`, { answers });
  }

  submitExam(resultExamenId: number): Observable<ResultExamen> {
    return this.http.post<ResultExamen>(`${this.baseUrl}/result-examens/${resultExamenId}/submit`, {});
  }

  getRemainingTime(resultExamenId: number): Observable<{ remainingSeconds: number }> {
    return this.http.get<{ remainingSeconds: number }>(`${this.baseUrl}/result-examens/${resultExamenId}/remaining-time`);
  }
}
