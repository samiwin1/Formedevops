import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../enviroments/environment';
import { Formation, ContenuFormation, FormationProgressResponse } from '../models/formation.models';

export interface FormationsPageResponse {
  content: Formation[];
  totalElements: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class FormationService {
  private readonly baseUrl = environment.formationApiUrl;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Formation[]> {
    return this.http.get<Formation[]>(`${this.baseUrl}/formations`);
  }

  getFormations(params: { category?: string; level?: string; search?: string; page?: number; size?: number }): Observable<FormationsPageResponse> {
    let httpParams = new HttpParams();
    if (params.category != null) httpParams = httpParams.set('category', params.category);
    if (params.level != null) httpParams = httpParams.set('level', params.level);
    if (params.search != null && params.search.trim()) httpParams = httpParams.set('search', params.search.trim());
    if (params.page != null) httpParams = httpParams.set('page', params.page.toString());
    if (params.size != null) httpParams = httpParams.set('size', params.size.toString());
    return this.http.get<FormationsPageResponse>(`${this.baseUrl}/formations`, { params: httpParams });
  }

  getFormationProgress(formationId: number, userId: number | null): Observable<FormationProgressResponse> {
    let httpParams = new HttpParams();
    if (userId != null) {
      httpParams = httpParams.set('userId', userId.toString());
    }
    return this.http.get<FormationProgressResponse>(
      `${this.baseUrl}/formations/${formationId}/progress`,
      { params: httpParams }
    );
  }

  resetFormationProgress(formationId: number, userId: number): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/formations/${formationId}/reset-progress?userId=${userId}`,
      {}
    );
  }

  getById(id: number): Observable<Formation> {
    return this.http.get<Formation>(`${this.baseUrl}/formations/${id}`);
  }

  create(formation: Formation): Observable<Formation> {
    return this.http.post<Formation>(`${this.baseUrl}/formations`, formation);
  }

  update(id: number, formation: Formation): Observable<Formation> {
    return this.http.put<Formation>(`${this.baseUrl}/formations/${id}`, formation);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/formations/${id}`);
  }

  getContentByFormationId(formationId: number): Observable<ContenuFormation[]> {
    return this.http.get<ContenuFormation[]>(`${this.baseUrl}/contenus-formation/formation/${formationId}`);
  }

  createContent(content: ContenuFormation): Observable<ContenuFormation> {
    return this.http.post<ContenuFormation>(`${this.baseUrl}/contenus-formation`, content);
  }

  updateContent(id: number, content: ContenuFormation): Observable<ContenuFormation> {
    return this.http.put<ContenuFormation>(`${this.baseUrl}/contenus-formation/${id}`, content);
  }

  deleteContent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/contenus-formation/${id}`);
  }

  generateWithAi(request: GenerateFormationRequest): Observable<Formation> {
    return this.http.post<Formation>(`${this.baseUrl}/formations/admin/generate-with-ai`, request);
  }
}

export interface GenerateFormationRequest {
  title: string;
  description?: string;
  objectives?: string;
  level?: string;
  skillsTargeted?: string;
  numberOfContentBlocks?: number;
  createdBy?: number;
}
