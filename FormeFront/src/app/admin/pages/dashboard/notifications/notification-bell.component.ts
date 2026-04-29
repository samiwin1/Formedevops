import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import {
  Notification,
  NotificationDashboardService,
  NotificationType
} from './notification-dashboard.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ClickOutsideDirective } from '../../../../core/directives/click-outside.directive';

@Component({
  selector: 'app-admin-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterLink, ClickOutsideDirective],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.css'
})
export class AdminNotificationBellComponent implements OnInit, OnDestroy {
  private readonly svc = inject(NotificationDashboardService);
  private readonly auth = inject(AuthService);

  isAdminOrSuperAdmin = false;
  unreadCount = 0;
  isOpen = false;
  recentNotifications: Notification[] = [];

  private pollSub?: Subscription;

  ngOnInit(): void {
    this.isAdminOrSuperAdmin = this.auth.isAdmin() || this.auth.isSuperAdmin();
    if (!this.isAdminOrSuperAdmin) {
      return;
    }

    this.refreshUnreadCount();
    this.pollSub = interval(60_000).subscribe(() => this.refreshUnreadCount());
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.loadRecentUnread();
    }
  }

  markRead(n: Notification): void {
    if (n.isRead) {
      return;
    }

    this.svc.markRead(n.id).subscribe({
      next: () => {
        this.recentNotifications = this.recentNotifications.filter((item) => item.id !== n.id);
        this.refreshUnreadCount();
      }
    });
  }

  markAllRead(): void {
    this.svc.markAllRead().subscribe({
      next: () => {
        this.unreadCount = 0;
        this.recentNotifications = [];
      }
    });
  }

  trackById(_: number, n: Notification): number {
    return n.id;
  }

  typeClass(type: NotificationType): string {
    return {
      INFO: 'type-info',
      SUCCESS: 'type-success',
      WARNING: 'type-warning',
      ERROR: 'type-error'
    }[type];
  }

  typeIcon(type: NotificationType): string {
    return {
      INFO: 'i',
      SUCCESS: '✓',
      WARNING: '!',
      ERROR: '×'
    }[type];
  }

  relativeTime(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60_000);

    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;

    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;

    return `${Math.floor(hours / 24)}d ago`;
  }

  private refreshUnreadCount(): void {
    this.svc.countUnread().subscribe({
      next: (res) => {
        this.unreadCount = res?.unread ?? 0;
      }
    });
  }

  private loadRecentUnread(): void {
    this.svc.getUnread().subscribe({
      next: (notifications) => {
        this.recentNotifications = [...notifications]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
      }
    });
  }
}
