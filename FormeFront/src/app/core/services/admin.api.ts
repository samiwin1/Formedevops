import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../enviroments/environment';
import { catchError, map, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

export type Profession = 'STUDENT' | 'DEVELOPER' | 'OTHER' | 'EVALUATOR' | 'UNKNOWN';
export interface AdminUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  profession: Profession;
  active?: boolean;
  isActive?: boolean;
}

export interface CreateAdminPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  profession: Profession;
}

type UserDirectoryEntry = {
  userId: number;
  firstName?: string | null;
  lastName?: string | null;
  profession?: string | null;
};

@Injectable({ providedIn: 'root' })
export class AdminApi {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = environment.apiUrl;
  private certificationApiUrl = environment.certificationApiUrl ?? environment.apiUrl;
  private base = `${this.apiUrl}/admin`;

  create(payload: CreateAdminPayload) {
    return this.http.post<AdminUser>(`${this.base}/create`, payload);
  }

  list(): Observable<AdminUser[]> {
    if (!this.auth.isSuperAdmin()) {
      return this.http.get<UserDirectoryEntry[]>(`${this.certificationApiUrl}/admin/user-directory`).pipe(
        map((rows) =>
          (rows ?? []).map((row) => ({
            id: row.userId,
            firstName: row.firstName ?? '',
            lastName: row.lastName ?? '',
            email: '',
            profession: this.normalizeProfession(row.profession),
            active: true,
          }))
        )
      );
    }

    return this.http.get<unknown>(`${this.base}/list`).pipe(
      map((payload) => this.normalizeUsers(payload)),
      catchError((err) => {
        if (err?.status !== 403) {
          return throwError(() => err);
        }
        return this.http.get<unknown>(`${this.apiUrl}/users/list`).pipe(
          map((payload) => this.normalizeUsers(payload))
        );
      })
    );
  }

  disable(id: number) {
    return this.http.patch<void>(`${this.base}/${id}/disable`, {});
  }

  private normalizeUsers(payload: unknown): AdminUser[] {
    if (Array.isArray(payload)) {
      return payload as AdminUser[];
    }
    if (payload && typeof payload === 'object') {
      const obj = payload as { data?: unknown; content?: unknown; users?: unknown };
      if (Array.isArray(obj.data)) return obj.data as AdminUser[];
      if (Array.isArray(obj.content)) return obj.content as AdminUser[];
      if (Array.isArray(obj.users)) return obj.users as AdminUser[];
    }
    return [];
  }

  private normalizeProfession(value?: string | null): Profession {
    const profession = (value ?? '').toUpperCase();
    if (profession === 'STUDENT' || profession === 'DEVELOPER' || profession === 'OTHER' || profession === 'EVALUATOR') {
      return profession;
    }
    return 'UNKNOWN';
  }
}
