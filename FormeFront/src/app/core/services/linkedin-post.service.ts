import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LinkedInPostResponse } from '../models/certification.models';
import { environment } from '../../../enviroments/environment';

@Injectable({ providedIn: 'root' })
export class LinkedInPostService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.certificationApiUrl}/me`;

  generatePost(issuedCertificationId: number): Observable<LinkedInPostResponse> {
    return this.http.post<LinkedInPostResponse>(`${this.api}/linkedin-post`, {
      issuedCertificationId,
    });
  }
}

