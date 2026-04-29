import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription, interval, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../../enviroments/environment';
import { AuthService } from './auth.service';

export interface AppNotification {
  id: number;
  userId: number;
  type: 'CERTIFICATE_ISSUED' | 'SESSION_ASSIGNED' | string;
  title: string;
  message: string;
  referenceId: number | null;
  read: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly api = `${environment.certificationApiUrl ?? ''}/me/notifications`;
  private pollSub?: Subscription;

  readonly notifications = signal<AppNotification[]>([]);
  readonly unreadCount = signal<number>(0);

  constructor(
    private readonly http: HttpClient,
    private readonly auth: AuthService,
  ) {}

  startPolling(): void {
    this.stopPolling();
    if (!this.auth.getToken()) return;
    this.loadAll();
    this.pollSub = interval(30_000).pipe(
      switchMap(() =>
        this.auth.getToken()
          ? this.http.get<{ count: number }>(`${this.api}/unread-count`)
          : of({ count: 0 })
      )
    ).subscribe({
      next: (res) => {
        this.unreadCount.set(res.count ?? 0);
        if ((res.count ?? 0) > 0) this.loadAll();
      },
      error: () => {},
    });
  }

  stopPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = undefined;
  }

  loadAll(): void {
    if (!this.auth.getToken()) return;
    this.http.get<AppNotification[]>(this.api).subscribe({
      next: (list) => {
        this.notifications.set(Array.isArray(list) ? list : []);
        this.unreadCount.set(this.notifications().filter((n) => !n.read).length);
      },
      error: () => { this.unreadCount.set(0); }
    });
  }

  markAllRead(): void {
    this.http.patch<void>(`${this.api}/mark-all-read`, {}).subscribe({
      next: () => {
        this.notifications.update((list) => list.map((n) => ({ ...n, read: true })));
        this.unreadCount.set(0);
      },
      error: (err) => { console.error('Notification mark-all-read failed', err); }
    });
  }

  markOneRead(id: number): void {
    this.http.patch<void>(`${this.api}/${id}/read`, {}).subscribe({
      next: () => {
        this.notifications.update((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
        this.unreadCount.set(this.notifications().filter((n) => !n.read).length);
      },
      error: (err) => { console.error('Notification mark-one-read failed', err); }
    });
  }
}
