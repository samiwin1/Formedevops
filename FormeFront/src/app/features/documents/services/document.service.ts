import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../enviroments/environment';
import { AdminDocument } from '../models/document.models';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly baseUrl = `${environment.documentApiUrl}/documents`;

  constructor(private http: HttpClient) {}

  listDocuments(search?: string): Observable<AdminDocument[]> {
    let params = new HttpParams();
    if (search != null && search.trim()) {
      params = params.set('q', search.trim());
    }
    return this.http.get<AdminDocument[]>(this.baseUrl, { params });
  }

  getDocument(id: number): Observable<AdminDocument> {
    return this.http.get<AdminDocument>(`${this.baseUrl}/${id}`);
  }

  getDocumentsByFormation(formationId: number): Observable<AdminDocument[]> {
    return this.http.get<AdminDocument[]>(`${this.baseUrl}/formation/${formationId}`).pipe(
      catchError(() =>
        this.listDocuments().pipe(
          map((docs) => (docs ?? []).filter((d) => d.formationId === formationId))
        )
      )
    );
  }

  createDocument(payload: {
    title: string;
    formationId: number;
    ownerId: number;
    ownerType: string;
    file: File;
  }): Observable<AdminDocument> {
    const fd = new FormData();
    fd.append('file', payload.file);
    fd.append('title', payload.title);
    fd.append('formationId', String(payload.formationId));
    fd.append('ownerId', String(payload.ownerId));
    fd.append('ownerType', payload.ownerType);
    return this.http.post<AdminDocument>(this.baseUrl, fd);
  }

  updateDocument(
    id: number,
    payload: { title?: string; formationId?: number; ownerId?: number; ownerType?: string; file?: File }
  ): Observable<AdminDocument> {
    if (payload.file) {
      const fd = new FormData();
      if (payload.title != null) fd.append('title', payload.title);
      if (payload.formationId != null) fd.append('formationId', String(payload.formationId));
      if (payload.ownerId != null) fd.append('ownerId', String(payload.ownerId));
      if (payload.ownerType != null) fd.append('ownerType', payload.ownerType);
      fd.append('file', payload.file);
      return this.http.put<AdminDocument>(`${this.baseUrl}/${id}`, fd);
    }
    return this.http.put<AdminDocument>(`${this.baseUrl}/${id}`, {
      title: payload.title,
      formationId: payload.formationId,
      ownerId: payload.ownerId,
      ownerType: payload.ownerType,
    });
  }

  deleteDocument(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  downloadFile(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/file`, { responseType: 'blob' });
  }

  getPreviewText(id: number): Observable<string> {
    return this.http.get(`${this.baseUrl}/${id}/preview`, { responseType: 'text' });
  }

  askDocument(id: number, question: string): Observable<{ answer: string; snippets: string[] }> {
    return this.http.post<{ answer: string; snippets: string[] }>(`${this.baseUrl}/${id}/ask`, { question });
  }
}
