import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../enviroments/environment';

export interface AgentThinkingFramesMetadata {
  count: number;
  baseUrl: string;
}

@Injectable({ providedIn: 'root' })
export class AgentThinkingService {
  private readonly apiBase = environment.formationApiUrl;

  constructor(private http: HttpClient) {}

  getFramesMetadata(): Observable<AgentThinkingFramesMetadata> {
    return this.http
      .get<AgentThinkingFramesMetadata>(`${this.apiBase}/agent-thinking/frames`)
      .pipe(
        catchError(() => of({ count: 0, baseUrl: `${this.apiBase}/agent-thinking` }))
      );
  }

  getFrameUrl(index: number, baseUrl?: string): string {
    const base = baseUrl ?? `${this.apiBase}/agent-thinking`;
    const padded = String(index).padStart(3, '0');
    return `${base}/frame_${padded}.png`;
  }
}
