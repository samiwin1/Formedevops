import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../enviroments/environment';

export interface CertificateReadyEvent {
  issuedCertificationId: number;
  certificateNumber: string;
}

/**
 * Listens to SSE stream for "certificate ready" events (real-time when a certificate is generated).
 * Uses fetch() with Authorization header since EventSource does not support custom headers.
 */
@Injectable({ providedIn: 'root' })
export class CertificateEventsService {
  private readonly url = `${environment.certificationApiUrl ?? environment.apiUrl}/me/certifications/events`;
  private readonly ready$ = new Subject<CertificateReadyEvent>();
  private abort: AbortController | null = null;

  constructor(private readonly auth: AuthService) {}

  get certificateReady(): Observable<CertificateReadyEvent> {
    return this.ready$.asObservable();
  }

  connect(): void {
    this.disconnect();
    const token = this.auth.getToken();
    if (!token) return;

    this.abort = new AbortController();
    const headers = new Headers({ Authorization: `Bearer ${token}` });

    fetch(this.url, { headers, signal: this.abort.signal })
      .then((response) => {
        if (!response.ok || !response.body) return;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const read = (): Promise<void> =>
          reader.read().then(({ done, value }) => {
            if (done) return;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split(/\r?\n/);
            buffer = lines.pop() ?? '';
            let eventName = '';
            let dataLine = '';
            for (const line of lines) {
              if (line.startsWith('event:')) eventName = line.slice(6).trim();
              else if (line.startsWith('data:')) dataLine = line.slice(5).trim();
            }
            if (eventName === 'certificate-ready' && dataLine) {
              try {
                const data = JSON.parse(dataLine) as CertificateReadyEvent;
                this.ready$.next(data);
              } catch {
                // ignore parse errors
              }
            }
            return read();
          });
        return read();
      })
      .catch(() => {
        // Connection closed or failed; caller can reconnect if needed
      });
  }

  disconnect(): void {
    if (this.abort) {
      this.abort.abort();
      this.abort = null;
    }
  }
}
