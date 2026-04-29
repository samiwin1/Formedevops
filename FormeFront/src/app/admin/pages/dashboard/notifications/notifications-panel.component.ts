import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  NotificationDashboardService,
  Notification,
  CreateNotificationRequest,
  NotificationType
} from './notification-dashboard.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-notifications-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notifications-panel.component.html',
  styleUrl: './notifications-panel.component.css'
})
export class NotificationsPanelComponent implements OnInit {
  private readonly svc = inject(NotificationDashboardService);
  private readonly toast = inject(ToastService);

  notifications: Notification[] = [];
  unreadCount = 0;
  loading = false;
  submitting = false;
  bulkActionInProgress = false;
  errorMessage = '';
  showForm = false;
  filterUnread = false;
  private readonly activeItemActions = new Set<number>();

  form: CreateNotificationRequest = {
    title: '',
    message: '',
    type: 'INFO',
    targetUserEmail: ''
  };

  types: NotificationType[] = ['INFO', 'SUCCESS', 'WARNING', 'ERROR'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.errorMessage = '';
    this.loading = true;
    this.svc.getAll().pipe(finalize(() => { this.loading = false; })).subscribe({
      next: (data) => {
        this.notifications = [...data].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.unreadCount = data.filter(n => !n.isRead).length;
      },
      error: () => {
        this.errorMessage = 'Unable to load notifications. Please try again.';
      }
    });
  }

  get displayed(): Notification[] {
    return this.filterUnread
      ? this.notifications.filter(n => !n.isRead)
      : this.notifications;
  }

  create(): void {
    const title = this.form.title.trim();
    const message = this.form.message.trim();
    const targetUserEmail = this.form.targetUserEmail?.trim();

    if (!title || !message || this.submitting) {
      return;
    }

    const req: CreateNotificationRequest = {
      title,
      message,
      type: this.form.type,
      targetUserEmail
    };

    if (!req.targetUserEmail) delete req.targetUserEmail;
    this.errorMessage = '';
    this.submitting = true;
    this.svc.create(req).pipe(finalize(() => { this.submitting = false; })).subscribe({
      next: () => {
        this.toast.success('Notification sent successfully.');
        this.resetForm();
        this.load();
      },
      error: () => {
        this.errorMessage = 'Failed to send notification.';
        this.toast.error('Failed to send notification.');
      }
    });
  }

  markRead(n: Notification): void {
    if (n.isRead || this.isItemActionInProgress(n.id)) return;
    this.activeItemActions.add(n.id);
    this.errorMessage = '';
    this.svc.markRead(n.id).pipe(finalize(() => { this.activeItemActions.delete(n.id); })).subscribe({
      next: () => this.load(),
      error: () => {
        this.errorMessage = 'Unable to mark notification as read.';
        this.toast.error('Unable to mark notification as read.');
      }
    });
  }

  markAllRead(): void {
    if (this.bulkActionInProgress || this.unreadCount === 0) return;
    this.bulkActionInProgress = true;
    this.errorMessage = '';
    this.svc.markAllRead().pipe(finalize(() => { this.bulkActionInProgress = false; })).subscribe({
      next: () => {
        this.toast.success('All notifications marked as read.');
        this.load();
      },
      error: () => {
        this.errorMessage = 'Unable to mark all notifications as read.';
        this.toast.error('Unable to mark all notifications as read.');
      }
    });
  }

  delete(id: number): void {
    if (this.isItemActionInProgress(id)) return;
    this.activeItemActions.add(id);
    this.errorMessage = '';
    this.svc.delete(id).pipe(finalize(() => { this.activeItemActions.delete(id); })).subscribe({
      next: () => {
        this.toast.success('Notification deleted.');
        this.load();
      },
      error: () => {
        this.errorMessage = 'Unable to delete notification.';
        this.toast.error('Unable to delete notification.');
      }
    });
  }

  resetForm(): void {
    this.form = { title: '', message: '', type: 'INFO', targetUserEmail: '' };
    this.showForm = false;
  }

  typeClass(type: NotificationType): string {
    return {
      INFO: 'badge-info',
      SUCCESS: 'badge-success',
      WARNING: 'badge-warning',
      ERROR: 'badge-error'
    }[type];
  }

  trackByNotificationId(_: number, n: Notification): number {
    return n.id;
  }

  isItemActionInProgress(id: number): boolean {
    return this.activeItemActions.has(id);
  }

  typeIcon(type: NotificationType): string {
    return {
      INFO: '💬',
      SUCCESS: '✅',
      WARNING: '⚠️',
      ERROR: '🔴'
    }[type];
  }

  relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }
}
