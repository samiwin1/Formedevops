import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalAnalyticsResponse } from '../../../../features/formation/services/statistics.service';

@Component({
  selector: 'app-learner-funnel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './learner-funnel.component.html',
  styleUrl: './learner-funnel.component.css'
})
export class LearnerFunnelComponent {
  @Input() analytics: GlobalAnalyticsResponse | null = null;

  get enrolled(): number {
    return this.analytics?.trainingCompletion?.totalStarted ?? 620;
  }

  get inProgress(): number {
    return Math.max(
      0,
      this.enrolled - this.completed
    ) || 210;
  }

  get completed(): number {
    return this.analytics?.trainingCompletion?.totalCompleted ?? 398;
  }

  get certIssued(): number {
    return Math.round(this.completed * 0.72);
  }

  get maxValue(): number {
    return Math.max(this.enrolled, this.inProgress, this.completed, this.certIssued, 1);
  }

  width(value: number): number {
    return Math.round((value / this.maxValue) * 100);
  }
}