import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatisticsService, GlobalAnalyticsResponse } from '../../../../features/formation/services/statistics.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-analytics-charts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics-charts.component.html',
  styleUrl: './analytics-charts.component.css',
})
export class AnalyticsChartsComponent implements OnInit {
  private readonly statisticsService = inject(StatisticsService);

  stats: GlobalAnalyticsResponse | null = null;
  loading = true;
  error = false;

  // Dummy fallback data
  private readonly DUMMY: GlobalAnalyticsResponse = {
    trainingCompletion: {
      totalStarted: 142,
      totalCompleted: 98,
      completionRatePercent: 69,
      topCompletedFormations: [
        { formationId: 1, formationTitle: 'Angular Advanced', count: 34, rate: 87 },
        { formationId: 2, formationTitle: 'Spring Boot Microservices', count: 28, rate: 78 },
        { formationId: 3, formationTitle: 'DevOps & Docker', count: 22, rate: 73 },
        { formationId: 4, formationTitle: 'React Fundamentals', count: 14, rate: 65 },
      ],
      topAbandonedFormations: [
        { formationId: 5, formationTitle: 'Machine Learning Basics', count: 18, rate: 52 },
        { formationId: 6, formationTitle: 'Kubernetes Mastery', count: 14, rate: 44 },
        { formationId: 7, formationTitle: 'Data Science with Python', count: 10, rate: 38 },
      ],
    },
    assessmentSuccess: {
      totalAttempts: 310,
      passedAttempts: 224,
      successRatePercent: 72,
      averageScore: 68.4,
      evaluationsWithHighFailure: [
        { evaluationId: 1, evaluationTitle: 'Final Exam – ML', formationTitle: 'Machine Learning Basics', failureRate: 58, attemptCount: 40 },
        { evaluationId: 2, evaluationTitle: 'Quiz – K8s Networks', formationTitle: 'Kubernetes Mastery', failureRate: 51, attemptCount: 29 },
      ],
    },
    examAnalysis: {
      passRate: 72,
      averageScore: 68.4,
      averageCompletionMinutes: 38,
      abnormalPatterns: {
        repeatedFailures: [],
        lowScores: [],
        longDurations: [],
      },
    },
    learningObstacles: {
      evaluationObstacles: [],
      retryObstacles: [],
      dropOffObstacles: [],
    },
  };

  ngOnInit(): void {
    this.statisticsService
      .getGlobalAnalytics()
      .pipe(catchError(() => of(null)))
      .subscribe((data) => {
       const isEmpty = !data ||
  (data.trainingCompletion?.totalStarted === 0 &&
   data.assessmentSuccess?.totalAttempts === 0);
this.stats = isEmpty ? this.DUMMY : data;
this.error = false;
        this.loading = false;
      });
  }

  get completionRate(): number {
    return this.stats?.trainingCompletion?.completionRatePercent ?? 0;
  }

  get passRate(): number {
    return this.stats?.assessmentSuccess?.successRatePercent ?? 0;
  }

  get avgScore(): number {
    return Math.round(this.stats?.assessmentSuccess?.averageScore ?? 0);
  }

  get totalStarted(): number {
    return this.stats?.trainingCompletion?.totalStarted ?? 0;
  }

  get totalCompleted(): number {
    return this.stats?.trainingCompletion?.totalCompleted ?? 0;
  }

  get topCompleted() {
    return this.stats?.trainingCompletion?.topCompletedFormations?.slice(0, 4) ?? [];
  }

  get topAbandoned() {
    return this.stats?.trainingCompletion?.topAbandonedFormations?.slice(0, 3) ?? [];
  }

  get highFailureEvals() {
    return this.stats?.assessmentSuccess?.evaluationsWithHighFailure?.slice(0, 3) ?? [];
  }

  get maxCompletedCount(): number {
    const counts = this.topCompleted.map((f) => f.count);
    return counts.length ? Math.max(...counts) : 1;
  }

  barWidth(count: number): number {
    return Math.round((count / this.maxCompletedCount) * 100);
  }

  rateColor(rate: number): string {
    if (rate >= 75) return 'green';
    if (rate >= 50) return 'orange';
    return 'red';
  }

  circumference = 2 * Math.PI * 40;

  dashOffset(rate: number): number {
    return this.circumference - (rate / 100) * this.circumference;
  }
}
