import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export type FormationOption = {
  id: number;
  title: string;
};

@Injectable({ providedIn: 'root' })
export class FormationDirectoryService {
  private readonly formationsUrl = '/formation-api/formations';

  constructor(private readonly http: HttpClient) {}

  getFormationOptions(): Observable<FormationOption[]> {
    return this.http.get<unknown>(this.formationsUrl).pipe(
      map((payload) => this.normalize(payload)),
      catchError(() => of([]))
    );
  }

  private normalize(payload: unknown): FormationOption[] {
    let rows: unknown[] = [];
    if (Array.isArray(payload)) {
      rows = payload;
    } else if (payload && typeof payload === 'object') {
      const page = payload as { content?: unknown };
      if (Array.isArray(page.content)) {
        rows = page.content;
      }
    }

    return rows
      .map((row) => this.toOption(row))
      .filter((row): row is FormationOption => row !== null);
  }

  private toOption(row: unknown): FormationOption | null {
    if (!row || typeof row !== 'object') {
      return null;
    }
    const item = row as { id?: unknown; title?: unknown; name?: unknown };
    const id = Number(item.id);
    if (!Number.isFinite(id) || id <= 0) {
      return null;
    }
    const title =
      (typeof item.title === 'string' && item.title.trim()) ||
      (typeof item.name === 'string' && item.name.trim()) ||
      `Formation #${id}`;
    return { id, title };
  }
}
