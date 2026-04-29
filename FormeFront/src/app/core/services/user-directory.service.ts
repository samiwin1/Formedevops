import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../enviroments/environment';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, switchMap, tap } from 'rxjs/operators';

type UserLookupDto = {
  id?: number;
  userId?: number;
  user_id?: number;
  displayName?: string;
  display_name?: string;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  fullName?: string;
  full_name?: string;
  name?: string;
  data?: UserLookupDto;
  user?: UserLookupDto;
};

type AdminListUserDto = {
  id: number;
  userId?: number;
  user_id?: number;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
};

export type UserDirectoryEntry = {
  userId: number;
  firstName: string;
  lastName: string;
  profession?: string | null;
  displayName: string;
};

@Injectable({ providedIn: 'root' })
export class UserDirectoryService {
  private readonly apiUrl = environment.apiUrl;
  private readonly certificationApiUrl = environment.certificationApiUrl ?? environment.apiUrl;
  private readonly namesCache = new Map<number, string>();
  private readonly pending = new Map<number, Observable<string>>();
  private adminListLoaded = false;
  private adminListAttempted = false;

  constructor(private readonly http: HttpClient) {}

  getUserName(userId: number): Observable<string> {
    if (!Number.isFinite(userId) || userId <= 0) {
      return of('-');
    }

    const fromCache = this.namesCache.get(userId);
    if (fromCache) {
      return of(fromCache);
    }

    const pendingRequest = this.pending.get(userId);
    if (pendingRequest) {
      return pendingRequest;
    }

    const request$ = this.fetchUserById(userId).pipe(
      map((user) => this.nameFromUnknown(user)),
      switchMap((name) => {
        if (name) {
          return of(name);
        }
        return this.lookupFromAdminList(userId);
      }),
      catchError(() => this.lookupFromAdminList(userId)),
      tap((name) => {
        if (!/^User\s+#\d+$/i.test(name)) {
          this.namesCache.set(userId, name);
        }
      }),
      finalize(() => this.pending.delete(userId)),
      shareReplay(1)
    );

    this.pending.set(userId, request$);
    return request$;
  }

  getNames(userIds: number[]): Observable<Record<number, string>> {
    const unique = Array.from(new Set(userIds.filter((id) => Number.isFinite(id) && id > 0)));
    if (!unique.length) {
      return of({});
    }

    let params = new HttpParams();
    unique.forEach((id) => {
      params = params.append('ids', id.toString());
    });

    return this.http
      .get<Record<string, string>>(`${this.certificationApiUrl}/user-directory`, {
        params,
      })
      .pipe(
        map((payload) => {
          const mapped: Record<number, string> = {};
          Object.entries(payload ?? {}).forEach(([k, v]) => {
            const id = Number(k);
            if (Number.isFinite(id) && typeof v === 'string' && v.trim()) {
              mapped[id] = v.trim();
              if (!/^User\s+#\d+$/i.test(v.trim())) {
                this.namesCache.set(id, v.trim());
              }
            }
          });
          return mapped;
        }),
        switchMap((mapped) => {
          const missing = unique.filter((id) => {
            const value = mapped[id];
            return !value || /^User\s+#\d+$/i.test(value);
          });
          if (!missing.length) {
            return of(mapped);
          }
          return this.getDirectoryEntries().pipe(
            switchMap((directoryEntries) => {
              const fromDirectory = directoryEntries.reduce<Record<number, string>>((acc, entry) => {
                if (entry.userId && entry.displayName?.trim()) {
                  acc[entry.userId] = entry.displayName.trim();
                }
                return acc;
              }, {});

              Object.entries(fromDirectory).forEach(([id, name]) => {
                const userId = Number(id);
                if (Number.isFinite(userId) && !/^User\s+#\d+$/i.test(name)) {
                  this.namesCache.set(userId, name);
                }
              });

              const stillMissing = missing.filter((id) => {
                const value = fromDirectory[id];
                return !value || /^User\s+#\d+$/i.test(value);
              });
              if (!stillMissing.length) {
                return of({ ...mapped, ...fromDirectory });
              }

              const requests = stillMissing.map((id) => this.getUserName(id).pipe(map((name) => ({ id, name }))));
              return forkJoin(requests).pipe(
                map((entries) =>
                  entries.reduce<Record<number, string>>((acc, entry) => {
                    acc[entry.id] = entry.name;
                    return acc;
                  }, { ...mapped, ...fromDirectory })
                )
              );
            }),
            catchError(() => {
              const requests = missing.map((id) => this.getUserName(id).pipe(map((name) => ({ id, name }))));
              return forkJoin(requests).pipe(
                map((entries) =>
                  entries.reduce<Record<number, string>>((acc, entry) => {
                    acc[entry.id] = entry.name;
                    return acc;
                  }, { ...mapped })
                )
              );
            })
          );
        }),
        catchError(() => {
          const requests = unique.map((id) => this.getUserName(id).pipe(map((name) => ({ id, name }))));
          return forkJoin(requests).pipe(
            map((entries) =>
              entries.reduce<Record<number, string>>((acc, entry) => {
                acc[entry.id] = entry.name;
                return acc;
              }, {})
            )
          );
        })
      );
  }

  getDirectoryEntries(): Observable<UserDirectoryEntry[]> {
    return this.http.get<UserDirectoryEntry[]>(`${this.certificationApiUrl}/admin/user-directory`).pipe(
      map((entries) =>
        (entries ?? []).map((entry) => ({
          ...entry,
          displayName:
            entry.displayName?.trim() ||
            [entry.firstName, entry.lastName].filter(Boolean).join(' ').trim() ||
            `User #${entry.userId}`,
        }))
      ),
      catchError(() => of([]))
    );
  }

  private lookupFromAdminList(userId: number): Observable<string> {
    if (this.adminListLoaded) {
      return of(this.namesCache.get(userId) ?? `User #${userId}`);
    }
    if (this.adminListAttempted) {
      return of(this.namesCache.get(userId) ?? `User #${userId}`);
    }
    this.adminListAttempted = true;

    const endpoints = [
      `${this.apiUrl}/users/list`,
      `${this.apiUrl}/users`,
      `${this.apiUrl}/admin/list`,
      `${this.apiUrl}/admin/users`,
      `${this.apiUrl}/super-admin/list`,
    ];

    return this.fetchFirstSuccessfulList(endpoints).pipe(
      tap((users) => {
        users.forEach((user) => {
          const id = this.idFromUnknown(user);
          const name = this.nameFromUnknown(user);
          if (id && name) {
            this.namesCache.set(id, name);
          }
        });
        this.adminListLoaded = true;
      }),
      map(() => this.namesCache.get(userId) ?? `User #${userId}`),
      catchError(() => of(`User #${userId}`))
    );
  }

  private formatName(
    firstName?: string,
    lastName?: string,
    fullName?: string,
    name?: string
  ): string | null {
    const firstLast = [firstName, lastName].filter(Boolean).join(' ').trim();
    const merged = firstLast || (fullName ?? '').trim() || (name ?? '').trim();
    return merged.length ? merged : null;
  }

  private nameFromUnknown(raw: unknown): string | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }
    const obj = raw as UserLookupDto;
    const display = obj.displayName ?? obj.display_name;
    const first = obj.firstName ?? obj.first_name;
    const last = obj.lastName ?? obj.last_name;
    const full = obj.fullName ?? obj.full_name;
    const direct = this.formatName(first, last, full, display ?? obj.name);
    if (direct) {
      return direct;
    }
    if (obj.data) {
      const nested = this.nameFromUnknown(obj.data);
      if (nested) {
        return nested;
      }
    }
    if (obj.user) {
      return this.nameFromUnknown(obj.user);
    }
    return null;
  }

  private idFromUnknown(raw: unknown): number | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }
    const obj = raw as AdminListUserDto;
    const value = obj.id ?? obj.userId ?? obj.user_id;
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  private fetchUserById(userId: number): Observable<unknown> {
    const endpoints = [
      `${this.certificationApiUrl}/user-directory/${userId}`,
      `${this.apiUrl}/users/${userId}`,
      `${this.apiUrl}/admin/users/${userId}`,
      `${this.apiUrl}/admin/${userId}`,
      `${this.apiUrl}/users/id/${userId}`,
      `${this.apiUrl}/admin/user/${userId}`,
    ];
    return this.fetchFirstSuccessfulObject(endpoints);
  }

  private fetchFirstSuccessfulObject(endpoints: string[]): Observable<unknown> {
    const [head, ...tail] = endpoints;
    if (!head) {
      return of({});
    }
    return this.http.get<unknown>(head).pipe(
      catchError(() => (tail.length ? this.fetchFirstSuccessfulObject(tail) : of({})))
    );
  }

  private fetchFirstSuccessfulList(endpoints: string[]): Observable<unknown[]> {
    const [head, ...tail] = endpoints;
    if (!head) {
      return of([]);
    }
    return this.http.get<unknown>(head).pipe(
      map((payload) => {
        if (Array.isArray(payload)) {
          return payload;
        }
        if (payload && typeof payload === 'object') {
          const obj = payload as { data?: unknown; content?: unknown; users?: unknown };
          if (Array.isArray(obj.data)) {
            return obj.data;
          }
          if (Array.isArray(obj.content)) {
            return obj.content;
          }
          if (Array.isArray(obj.users)) {
            return obj.users;
          }
        }
        return [];
      }),
      catchError(() => (tail.length ? this.fetchFirstSuccessfulList(tail) : of([])))
    );
  }
}
