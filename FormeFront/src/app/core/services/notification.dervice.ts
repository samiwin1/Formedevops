import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BusinessService } from './business.service';

export interface AppNotification {
  id: string;
  type: 'warning' | 'danger' | 'info';
  icon: string;
  title: string;
  message: string;
  date: Date;
  read: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private businessService = inject(BusinessService);

  private _notifications = new BehaviorSubject<AppNotification[]>([]);
  notifications$ = this._notifications.asObservable();

  get unreadCount(): number {
    return this._notifications.value.filter(n => !n.read).length;
  }

  get all(): AppNotification[] {
    return this._notifications.value;
  }

  // ✅ Charge et calcule toutes les notifications
  load(): void {
    const notifs: AppNotification[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const in7Days = new Date(today);
    in7Days.setDate(today.getDate() + 7);

    const in3Days = new Date(today);
    in3Days.setDate(today.getDate() + 3);

    // ── Access Codes ──────────────────────────────────────────────────
    this.businessService.getAccessCodes().subscribe(codes => {
      codes.forEach(code => {
        const exp = new Date(code.expirationDate);
        exp.setHours(0, 0, 0, 0);

        if (!code.used) {
          // Expiré aujourd'hui ou dans le passé
          if (exp < today) {
            notifs.push({
              id: `code-expired-${code.id}`,
              type: 'danger',
              icon: 'feather-alert-circle',
              title: 'Access Code Expired',
              message: `Code "${code.code}" expired on ${exp.toLocaleDateString('en-GB')}`,
              date: exp,
              read: false,
            });
          }
          // Expire dans 3 jours ou moins
          else if (exp <= in3Days) {
            notifs.push({
              id: `code-urgent-${code.id}`,
              type: 'danger',
              icon: 'feather-clock',
              title: 'Code Expiring Soon!',
              message: `Code "${code.code}" expires on ${exp.toLocaleDateString('en-GB')} — urgent!`,
              date: exp,
              read: false,
            });
          }
          // Expire dans 7 jours
          else if (exp <= in7Days) {
            notifs.push({
              id: `code-warning-${code.id}`,
              type: 'warning',
              icon: 'feather-clock',
              title: 'Code Expiring in 7 Days',
              message: `Code "${code.code}" expires on ${exp.toLocaleDateString('en-GB')}`,
              date: exp,
              read: false,
            });
          }
        }
      });

      // ── Deals ────────────────────────────────────────────────────────
      this.businessService.getDeals().subscribe(deals => {
        deals.forEach(deal => {
          const end = new Date(deal.endDate);
          end.setHours(0, 0, 0, 0);

          // Deal terminé récemment (dans les 3 derniers jours)
          const minus3Days = new Date(today);
          minus3Days.setDate(today.getDate() - 3);

          if (end >= minus3Days && end < today) {
            notifs.push({
              id: `deal-finished-${deal.id}`,
              type: 'info',
              icon: 'feather-check-circle',
              title: 'Deal Just Finished',
              message: `Deal "${deal.title}" ended on ${end.toLocaleDateString('en-GB')}`,
              date: end,
              read: false,
            });
          }
          // Deal expire dans 7 jours
          else if (end >= today && end <= in7Days) {
            notifs.push({
              id: `deal-ending-${deal.id}`,
              type: 'warning',
              icon: 'feather-briefcase',
              title: 'Deal Ending Soon',
              message: `Deal "${deal.title}" ends on ${end.toLocaleDateString('en-GB')}`,
              date: end,
              read: false,
            });
          }
        });

        // Tri par date puis par urgence
        notifs.sort((a, b) => {
          if (a.type === 'danger' && b.type !== 'danger') return -1;
          if (b.type === 'danger' && a.type !== 'danger') return 1;
          return a.date.getTime() - b.date.getTime();
        });

        this._notifications.next(notifs);
      });
    });
  }

  markAsRead(id: string): void {
    const updated = this._notifications.value.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    this._notifications.next(updated);
  }

  markAllAsRead(): void {
    const updated = this._notifications.value.map(n => ({ ...n, read: true }));
    this._notifications.next(updated);
  }

  clearAll(): void {
    this._notifications.next([]);
  }
}