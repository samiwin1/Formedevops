import { Injectable, inject, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../enviroments/environment';

export interface DailyCount  { date: string;  count: number; }
export interface MonthlyCount { month: string; count: number; }

export interface DashboardStatsDto {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  usersByProfession: Record<string, number>;
  registrationsLast14Days: DailyCount[];
  registrationsLast6Months: MonthlyCount[];
  serverTimestamp: number;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardLiveService {
  private readonly http = inject(HttpClient);
  private readonly zone = inject(NgZone);

  private readonly base = `${environment.apiUrl}/admin/dashboard`;

  /** One-shot REST snapshot */
  getStats(): Observable<DashboardStatsDto> {
    return this.http.get<DashboardStatsDto>(`${this.base}/stats`);
  }

  /** SSE live stream — emits every time the server pushes an update */
  getLiveStats(): Observable<DashboardStatsDto> {
    const subject = new Subject<DashboardStatsDto>();

    // Get JWT token for auth header (SSE doesn't support headers natively,
    // so we append token as query param — backend reads it via filter)
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const url = `${this.base}/stats/live${token ? '?token=' + token : ''}`;

    const eventSource = new EventSource(url);

    eventSource.addEventListener('stats', (event: any) => {
      this.zone.run(() => {
        try {
          subject.next(JSON.parse(event.data));
        } catch { /* ignore parse errors */ }
      });
    });

    eventSource.onerror = () => {
      // EventSource auto-reconnects; just log
      console.warn('[DashboardLive] SSE reconnecting...');
    };

    // Clean up when observable unsubscribed
    subject.subscribe({ complete: () => eventSource.close() });

    return subject.asObservable();
  }
}
