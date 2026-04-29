import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../enviroments/environment';

export interface FormationStatItem {
  formationId: number;
  formationTitle: string;
  count: number;
  rate: number;
}

export interface EvaluationFailureItem {
  evaluationId: number;
  evaluationTitle: string;
  formationTitle: string;
  failureRate: number;
  attemptCount: number;
}

export interface TrainingCompletionStats {
  totalStarted: number;
  totalCompleted: number;
  completionRatePercent: number;
  topCompletedFormations: FormationStatItem[];
  topAbandonedFormations: FormationStatItem[];
}

export interface AssessmentSuccessStats {
  totalAttempts: number;
  passedAttempts: number;
  successRatePercent: number;
  averageScore: number;
  evaluationsWithHighFailure: EvaluationFailureItem[];
}

export interface RepeatedFailureItem {
  examenId: number;
  examenTitle: string;
  userId: number;
  failureCount: number;
}

export interface LowScoreExamItem {
  examenId: number;
  examenTitle: string;
  formationTitle: string;
  averageScore: number;
}

export interface LongDurationExamItem {
  examenId: number;
  examenTitle: string;
  formationTitle: string;
  averageDurationMinutes: number;
  expectedDurationMinutes: number;
}

export interface AbnormalExamPatterns {
  repeatedFailures: RepeatedFailureItem[];
  lowScores: LowScoreExamItem[];
  longDurations: LongDurationExamItem[];
}

export interface ExamAnalysisStats {
  passRate: number;
  averageScore: number;
  averageCompletionMinutes: number | null;
  abnormalPatterns: AbnormalExamPatterns;
}

export interface ObstacleItem {
  evaluationId: number;
  evaluationTitle: string;
  formationTitle: string;
  indicatorValue: number;
}

export interface DropOffObstacleItem {
  formationId: number;
  formationTitle: string;
  userCount: number;
}

export interface LearningObstacleStats {
  evaluationObstacles: ObstacleItem[];
  retryObstacles: ObstacleItem[];
  dropOffObstacles: DropOffObstacleItem[];
}

export interface GlobalAnalyticsResponse {
  trainingCompletion: TrainingCompletionStats;
  assessmentSuccess: AssessmentSuccessStats;
  examAnalysis: ExamAnalysisStats;
  learningObstacles: LearningObstacleStats;
  aiInsights?: string;
}

@Injectable({ providedIn: 'root' })
export class StatisticsService {
  private readonly baseUrl = environment.formationApiUrl;

  constructor(private http: HttpClient) {}

  getGlobalAnalytics(): Observable<GlobalAnalyticsResponse> {
    return this.http.get<GlobalAnalyticsResponse>(`${this.baseUrl}/formations/admin/statistics`);
  }

  getGlobalAnalyticsWithInsights(): Observable<GlobalAnalyticsResponse> {
    return this.http.get<GlobalAnalyticsResponse>(`${this.baseUrl}/formations/admin/statistics/insights`);
  }
}
