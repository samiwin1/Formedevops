import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { environment } from '../../../enviroments/environment';
import {
  Certification,
  CreateCertificationRequest,
  UpdateCertificationRequest,
} from '../models/certification.models';

@Injectable({ providedIn: 'root' })
export class CertificationService {
  private readonly baseUrl = `${environment.certificationApiUrl ?? environment.apiUrl}/certifications`;

  constructor(private readonly http: HttpClient) {}

  list() {
    return this.http.get<Certification[]>(this.baseUrl);
  }

  count() {
    return this.http.get<{ count: number }>(`${this.baseUrl}/count`).pipe(
      catchError(() => of({ count: 0 }))
    );
  }

  create(payload: CreateCertificationRequest) {
    return this.http.post<Certification>(this.baseUrl, payload);
  }

  update(id: number, payload: UpdateCertificationRequest) {
    return this.http.put<Certification>(`${this.baseUrl}/${id}`, payload);
  }

  publish(id: number) {
    return this.http.patch<Certification>(`${this.baseUrl}/${id}/publish`, {});
  }

  archive(id: number) {
    return this.http.patch<Certification>(`${this.baseUrl}/${id}/archive`, {});
  }
}
