import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';

export type AnnouncementStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Announcement {
  id: number;
  title: string;
  content: string;
  status: AnnouncementStatus;
  pinned: boolean;
  createdByEmail: string | null;
  createdAt: string;
  publishedAt: string | null;
}

export interface AnnouncementPayload {
  title: string;
  content: string;
  status: AnnouncementStatus;
  pinned: boolean;
  createdByEmail?: string;
}

@Injectable({ providedIn: 'root' })
export class AnnouncementService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/admin/dashboard/announcements';
  private readonly publicBase = '/api/dashboard/announcements';
  private readonly proxiedPublicBase = '/user-api/dashboard/announcements';

  // ── Read ──────────────────────────────────────────────────────────
  getAll(): Observable<Announcement[]> {
    return this.readList(this.base);
  }

  getByStatus(status: AnnouncementStatus): Observable<Announcement[]> {
    const params = new HttpParams().set('status', status);
    return this.readList(`${this.base}/by-status`, params);
  }

  getPublished(): Observable<Announcement[]> {
    const params = new HttpParams().set('status', 'PUBLISHED');

    return this.readList(`${this.proxiedPublicBase}/published`).pipe(
      catchError(() => this.readList(`${this.publicBase}/published`)),
      catchError(() => this.readList(this.proxiedPublicBase, params)),
      catchError(() => this.readList(this.publicBase, params)),
      catchError(() => this.readList(this.base, params).pipe(map((rows) => rows.filter((a) => a.status === 'PUBLISHED')))),
      catchError(() => this.readList(`${this.base}/by-status`, params)),
      catchError(() => this.getAll().pipe(map((rows) => rows.filter((a) => a.status === 'PUBLISHED'))))
    );
  }

  // ── Write ─────────────────────────────────────────────────────────
  /** Create a new DRAFT announcement. */
  create(title: string, content: string, pinned: boolean, createdByEmail?: string): Observable<Announcement> {
    const body: Record<string, unknown> = { title, content, pinned, status: 'DRAFT' };
    if (createdByEmail) body['createdByEmail'] = createdByEmail;
    return this.http.post<Announcement>(this.base, body);
  }

  publish(id: number): Observable<Announcement> {
    return this.http.patch<Announcement>(`${this.base}/${id}/publish`, {});
  }

  /**
   * Full replacement of an announcement — used for edit,
   * archive, and pin toggle. Sending the complete object
   * avoids partial-update 403s on the backend.
   */
  save(a: Announcement): Observable<Announcement> {
    const body: AnnouncementPayload = {
      title:   a.title,
      content: a.content,
      status:  a.status,
      pinned:  a.pinned,
    };
    if (a.createdByEmail) body.createdByEmail = a.createdByEmail;
    return this.http.put<Announcement>(`${this.base}/${a.id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  private readList(url: string, params?: HttpParams): Observable<Announcement[]> {
    return this.http.get<unknown>(url, { params }).pipe(
      map((payload) => this.normalizeList(payload))
    );
  }

  private normalizeList(payload: unknown): Announcement[] {
    if (Array.isArray(payload)) {
      return payload as Announcement[];
    }

    if (!payload || typeof payload !== 'object') {
      return [];
    }

    const response = payload as Record<string, unknown>;
    const candidates = [
      response['data'],
      response['content'],
      response['items'],
      response['results'],
      response['announcements']
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate as Announcement[];
      }
    }

    return [];
  }
}
