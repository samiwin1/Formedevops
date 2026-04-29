import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../enviroments/environment';
import { IssuedCertification } from '../models/certification.models';

@Injectable({ providedIn: 'root' })
export class IssuedCertificationService {
  private readonly baseUrl = `${environment.certificationApiUrl ?? environment.apiUrl}/admin/issued-certifications`;

  constructor(private readonly http: HttpClient) {}

  listForAdmin(filters?: { learnerId?: number; formationId?: number; status?: 'ISSUED' | 'REVOKED' }) {
    let params = new HttpParams();
    if (filters?.learnerId != null) {
      params = params.set('learnerId', String(filters.learnerId));
    }
    if (filters?.formationId != null) {
      params = params.set('formationId', String(filters.formationId));
    }
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    return this.http.get<IssuedCertification[]>(this.baseUrl, { params });
  }

  revoke(id: number) {
    return this.http.patch<IssuedCertification>(`${this.baseUrl}/${id}/revoke`, {});
  }
}
