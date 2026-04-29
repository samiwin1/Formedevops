import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  StatisticsService,
  GlobalAnalyticsResponse,
} from '../../../services/statistics.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ChartComponent } from 'ngx-apexcharts';

@Component({
  selector: 'app-formation-analytics',
  standalone: true,
  imports: [CommonModule, RouterLink, ChartComponent],
  templateUrl: './formation-analytics.component.html',
  styleUrl: './formation-analytics.component.scss',
})
export class FormationAnalyticsComponent implements OnInit {
  private statisticsService = inject(StatisticsService);

  data: GlobalAnalyticsResponse | null = null;
  loading = true;
  error: string | null = null;

  // Chart options - computed from data
  completionChart = computed(() => {
    const d = this.data;
    if (!d || d.trainingCompletion.totalStarted === 0) return null;
    const tc = d.trainingCompletion;
    const inProgress = Math.max(0, tc.totalStarted - tc.totalCompleted);
    return {
      series: [tc.totalCompleted, inProgress],
      chart: { type: 'donut' as const, height: 300 },
      labels: ['Completed', 'In Progress'],
      colors: ['#10b981', '#f59e0b'],
      legend: { position: 'bottom' as const, fontSize: '14px' },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => Math.round(val) + '%',
      },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total',
                formatter: () => String(tc.totalStarted),
              },
            },
          },
        },
      },
      stroke: { width: 2, colors: ['#fff'] },
    };
  });

  assessmentChart = computed(() => {
    const d = this.data;
    if (!d || d.assessmentSuccess.totalAttempts === 0) return null;
    const as = d.assessmentSuccess;
    const failed = Math.max(0, as.totalAttempts - as.passedAttempts);
    return {
      series: [
        { name: 'Passed', data: [as.passedAttempts], color: '#10b981' },
        { name: 'Failed', data: [failed], color: '#ef4444' },
      ],
      chart: { type: 'bar' as const, height: 300, stacked: true },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 6,
          barHeight: '60%',
        },
      },
      xaxis: { categories: ['Attempts'] },
      legend: { position: 'top' as const, fontSize: '14px' },
      dataLabels: { enabled: true },
      grid: { padding: { top: 0, right: 20, bottom: 0, left: 20 } },
    };
  });

  examChart = computed(() => {
    const d = this.data;
    const passRate = d?.examAnalysis?.passRate ?? 0;
    return {
      series: [Math.min(100, Math.round(passRate))],
      chart: { type: 'radialBar' as const, height: 300 },
      plotOptions: {
        radialBar: {
          hollow: { size: '65%' },
          track: { background: '#e5e7eb' },
          dataLabels: {
            name: { show: true, fontSize: '16px', offsetY: -5 },
            value: {
              show: true,
              fontSize: '28px',
              fontWeight: 700,
              offsetY: 5,
              formatter: (v: number) => v + '%',
            },
          },
        },
      },
      labels: ['Pass Rate'],
      colors: ['#3b82f6'],
      stroke: { lineCap: 'round' as const },
    };
  });

  obstaclesChart = computed(() => {
    const d = this.data;
    if (!d) return null;
    const lo = d.learningObstacles;
    const evalCount = lo.evaluationObstacles?.length ?? 0;
    const retryCount = lo.retryObstacles?.length ?? 0;
    const dropCount = lo.dropOffObstacles?.length ?? 0;
    if (evalCount + retryCount + dropCount === 0) return null;
    return {
      series: [evalCount, retryCount, dropCount],
      chart: { type: 'donut' as const, height: 300 },
      labels: ['Evaluation Obstacles', 'Retry Obstacles', 'Drop-off Obstacles'],
      colors: ['#ef4444', '#f59e0b', '#6b7280'],
      legend: { position: 'bottom' as const, fontSize: '14px' },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => Math.round(val) + '%',
      },
      plotOptions: { pie: { donut: { size: '70%' } } },
      stroke: { width: 2, colors: ['#fff'] },
    };
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;

    this.statisticsService.getGlobalAnalytics().subscribe({
      next: (res: GlobalAnalyticsResponse) => {
        this.data = res;
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.error =
          err?.error?.message ||
          err?.message ||
          'Cannot reach server. Ensure Formation Service and API Gateway (port 8082) are running.';
      },
    });
  }

  refresh(): void {
    this.load();
  }
}
