import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlatformDashboardData } from '../dashboard.component';

interface FeedItem {
  icon: string;
  title: string;
  meta: string;
  type: 'users' | 'formations' | 'certs' | 'assessments' | 'shop' | 'sessions';
}

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activity-feed.component.html',
  styleUrl: './activity-feed.component.css'
})
export class ActivityFeedComponent implements OnChanges {
  @Input() data!: PlatformDashboardData;

  items: FeedItem[] = [];

  ngOnChanges(): void {
    if (!this.data) return;

    this.items = [
      {
        icon: 'bi-people-fill',
        title: `${this.data.newUsersThisWeek} new users joined this week`,
        meta: 'User domain · latest signup activity',
        type: 'users'
      },
      {
        icon: 'bi-journal-check',
        title: `${this.data.analytics?.trainingCompletion?.totalCompleted ?? 0} learners completed training`,
        meta: 'Formation domain · completion pipeline',
        type: 'formations'
      },
      {
        icon: 'bi-patch-check-fill',
        title: `${this.data.issuedCerts} certifications issued`,
        meta: 'Certification domain · live issuance count',
        type: 'certs'
      },
      {
        icon: 'bi-clipboard-data-fill',
        title: `Average assessment score is ${Math.round(this.data.analytics?.assessmentSuccess?.averageScore ?? 0)}%`,
        meta: 'Assessment domain · latest scoring snapshot',
        type: 'assessments'
      },
      {
        icon: 'bi-bag-check-fill',
        title: `${this.data.completedOrders} shop orders completed`,
        meta: 'Shop domain · revenue operations',
        type: 'shop'
      },
      {
        icon: 'bi-calendar-event-fill',
        title: `${this.data.upcomingSessions.length} oral sessions in the next 7 days`,
        meta: 'Sessions domain · scheduling pipeline',
        type: 'sessions'
      }
    ];
  }
}