import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../enviroments/environment';
import {
  CreateOralSessionRequest,
  OralSession,
  UpdateOralSessionRequest,
} from '../models/certification.models';

@Injectable({ providedIn: 'root' })
export class OralSessionService {
  private readonly baseUrl = `${environment.certificationApiUrl ?? environment.apiUrl}/oral-sessions`;

  constructor(private readonly http: HttpClient) {}

  list() {
    return this.http.get<OralSession[]>(this.baseUrl);
  }

  create(payload: CreateOralSessionRequest) {
    return this.http.post<OralSession>(this.baseUrl, payload);
  }

  update(id: number, payload: UpdateOralSessionRequest) {
    return this.http.put<OralSession>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
