import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type NotificationType = 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  targetUserEmail: string | null;
  createdAt: string;
}

export interface CreateNotificationRequest {
  title: string;
  message: string;
  type: NotificationType;
  targetUserEmail?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationDashboardService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/admin/dashboard/notifications';

  getAll(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.base);
  }

  getUnread(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.base}/unread`);
  }

  countUnread(): Observable<{ unread: number }> {
    return this.http.get<{ unread: number }>(`${this.base}/count`);
  }

  create(req: CreateNotificationRequest): Observable<Notification> {
    return this.http.post<Notification>(this.base, req);
  }

  markRead(id: number): Observable<Notification> {
    return this.http.patch<Notification>(`${this.base}/${id}/read`, {});
  }

  markAllRead(): Observable<void> {
    return this.http.patch<void>(`${this.base}/read-all`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
