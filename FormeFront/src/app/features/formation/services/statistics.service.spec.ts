import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { StatisticsService } from './statistics.service';
import { environment } from '../../../../enviroments/environment';

describe('StatisticsService', () => {
  let service: StatisticsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StatisticsService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(StatisticsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('gets global analytics', () => {
    service.getGlobalAnalytics().subscribe((response) => {
      expect(response.trainingCompletion.completionRatePercent).toBe(70);
    });

    const req = httpMock.expectOne(`${environment.formationApiUrl}/formations/admin/statistics`);
    expect(req.request.method).toBe('GET');
    req.flush(payload());
  });

  it('gets global analytics with AI insights', () => {
    service.getGlobalAnalyticsWithInsights().subscribe((response) => {
      expect(response.aiInsights).toBe('Focus on beginner courses');
    });

    const req = httpMock.expectOne(`${environment.formationApiUrl}/formations/admin/statistics/insights`);
    expect(req.request.method).toBe('GET');
    req.flush({ ...payload(), aiInsights: 'Focus on beginner courses' });
  });

  function payload() {
    return {
      trainingCompletion: {
        totalStarted: 10,
        totalCompleted: 7,
        completionRatePercent: 70,
        topCompletedFormations: [],
        topAbandonedFormations: [],
      },
      assessmentSuccess: {
        totalAttempts: 10,
        passedAttempts: 8,
        successRatePercent: 80,
        averageScore: 75,
        evaluationsWithHighFailure: [],
      },
      examAnalysis: {
        passRate: 80,
        averageScore: 75,
        averageCompletionMinutes: null,
        abnormalPatterns: { repeatedFailures: [], lowScores: [], longDurations: [] },
      },
      learningObstacles: {
        evaluationObstacles: [],
        retryObstacles: [],
        dropOffObstacles: [],
      },
    };
  }
});
