import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AppNotification, NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="dropdown">
      <a class="nxl-head-link me-3" (click)="togglePanel($event)" href="#" role="button">
        <i class="feather-bell"></i>
        @if (unreadCount() > 0) {
          <span class="badge bg-danger nxl-h-badge">{{ unreadCount() > 9 ? '9+' : unreadCount() }}</span>
        }
      </a>

      @if (panelOpen()) {
        <div class="dropdown-menu dropdown-menu-end nxl-h-dropdown nxl-notifications-menu show fm-notif-menu">
          <div class="d-flex justify-content-between align-items-center notifications-head">
            <h6 class="fw-bold text-dark mb-0">
              <i class="feather-bell me-2"></i>Notifications
            </h6>
            @if (unreadCount() > 0) {
              <a href="#" class="fs-11 text-success text-end ms-auto mark-read-link" (click)="markAllRead($event)">
                <i class="feather-check-circle me-1"></i>
                <span>Mark all read</span>
              </a>
            }
          </div>

          @if (unreadNotifications().length === 0) {
            <div class="text-center p-4 text-muted empty-state">
              <i class="feather-inbox"></i>
              <p class="mb-0 mt-2">No notifications yet.</p>
            </div>
          } @else {
            @for (notif of unreadNotifications(); track notif.id) {
              <button type="button" class="notifications-item fm-notif-item fm-unread" (click)="onNotifClick(notif, $event)">
                <div class="notif-icon-wrapper">
                  @if (notif.type === 'CERTIFICATE_ISSUED') {
                    <div class="notif-icon notif-icon-success">
                      <i class="feather-award"></i>
                    </div>
                  } @else if (notif.type === 'SESSION_ASSIGNED') {
                    <div class="notif-icon notif-icon-info">
                      <i class="feather-calendar"></i>
                    </div>
                  } @else {
                    <div class="notif-icon notif-icon-default">
                      <i class="feather-bell"></i>
                    </div>
                  }
                </div>
                <div class="notifications-desc">
                  <div class="font-body">
                    <span class="fw-bold text-dark notif-title">{{ notif.title }}</span>
                    <div class="text-muted mt-1 notif-message">{{ notif.message }}</div>
                  </div>
                  <div class="notifications-date">
                    <i class="feather-clock me-1"></i>
                    {{ notif.createdAt | date:'MMM d, h:mm a' }}
                  </div>
                </div>
              </button>
            }
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .fm-notif-menu {
      display: block;
      max-height: 480px;
      overflow-y: auto;
      min-width: 400px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      border: 1px solid #e2e8f0;
    }
    
    .notifications-head {
      padding: 16px 20px;
      border-bottom: 2px solid #e2e8f0;
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      border-radius: 12px 12px 0 0;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    
    .notifications-head h6 {
      font-size: 16px;
      display: flex;
      align-items: center;
      color: #1e293b;
    }
    
    .notifications-head h6 i {
      color: #3b82f6;
      font-size: 18px;
    }
    
    .mark-read-link {
      display: flex;
      align-items: center;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
      padding: 4px 8px;
      border-radius: 6px;
    }
    
    .mark-read-link:hover {
      background: #dcfce7;
      color: #16a34a !important;
    }
    
    .empty-state {
      padding: 40px 20px !important;
    }
    
    .empty-state i {
      font-size: 48px;
      color: #cbd5e1;
    }
    
    .empty-state p {
      font-size: 14px;
      color: #64748b;
    }
    
    .fm-notif-item {
      cursor: pointer;
      border-left: 4px solid transparent;
      width: 100%;
      text-align: left;
      border-top: 0;
      border-right: 0;
      border-bottom: 1px solid #f1f5f9;
      background: white;
      padding: 16px 20px;
      display: flex;
      gap: 14px;
      align-items: flex-start;
      transition: all 0.2s ease;
    }
    
    .fm-notif-item:hover {
      background: #f8fafc;
      border-left-color: #3b82f6;
    }
    
    .fm-notif-item.fm-unread {
      background: linear-gradient(90deg, #eff6ff 0%, #f8fafc 100%);
      border-left-color: #3b82f6;
    }
    
    .fm-notif-item.fm-unread:hover {
      background: linear-gradient(90deg, #dbeafe 0%, #f1f5f9 100%);
    }
    
    .notif-icon-wrapper {
      flex-shrink: 0;
    }
    
    .notif-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    
    .notif-icon-success {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
    }
    
    .notif-icon-info {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
    }
    
    .notif-icon-default {
      background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      color: white;
    }
    
    .notifications-desc {
      flex: 1;
      min-width: 0;
    }
    
    .notif-title {
      font-size: 14px;
      line-height: 1.4;
      display: block;
      color: #1e293b;
    }
    
    .notif-message {
      font-size: 13px;
      line-height: 1.5;
      color: #64748b;
      margin-top: 4px;
    }
    
    .notifications-date {
      display: flex;
      align-items: center;
      font-size: 12px;
      color: #94a3b8;
      margin-top: 8px;
      font-weight: 500;
    }
    
    .notifications-date i {
      font-size: 12px;
    }
    
    .fm-notif-menu::-webkit-scrollbar {
      width: 6px;
    }
    
    .fm-notif-menu::-webkit-scrollbar-track {
      background: #f1f5f9;
    }
    
    .fm-notif-menu::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }
    
    .fm-notif-menu::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  readonly panelOpen = signal(false);
  readonly notifications = this.notificationService.notifications;
  readonly unreadCount = this.notificationService.unreadCount;
  readonly unreadNotifications = computed(() => this.notifications().filter((n) => !n.read));

  ngOnInit(): void {
    this.notificationService.startPolling();
  }

  ngOnDestroy(): void {
    this.notificationService.stopPolling();
  }

  togglePanel(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const next = !this.panelOpen();
    this.panelOpen.set(next);
    if (next) {
      this.notificationService.loadAll();
    }
  }

  markAllRead(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.notificationService.markAllRead();
  }

  onNotifClick(notification: AppNotification, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!notification.read) {
      this.notificationService.markOneRead(notification.id);
    }
    this.panelOpen.set(false);
    this.navigateFromNotification(notification);
  }

  private navigateFromNotification(notification: AppNotification): void {
    const inAdminArea = this.router.url.startsWith('/admin');

    if (notification.type === 'CERTIFICATE_ISSUED') {
      if (inAdminArea) {
        this.router.navigate(['/admin/issued-certificates']);
      } else {
        this.navigateAndScroll('/me/certification-space', 'my-certifications');
      }
      return;
    }

    if (notification.type === 'SESSION_ASSIGNED') {
      if (inAdminArea) {
        this.router.navigate(['/admin/oral-sessions']);
      } else {
        this.navigateAndScroll('/me/certification-space', 'my-oral-sessions');
      }
      return;
    }

    this.router.navigate(['/me/certification-space']);
  }

  private navigateAndScroll(path: string, fragmentId: string): void {
    if (this.router.url.startsWith(path)) {
      setTimeout(() => {
        document.getElementById(fragmentId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
      return;
    }

    this.router.navigate([path], { fragment: fragmentId }).then(() => {
      setTimeout(() => {
        document.getElementById(fragmentId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    });
  }
}
