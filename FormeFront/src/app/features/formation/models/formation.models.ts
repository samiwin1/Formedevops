export interface Formation {
  id?: number;
  title: string;
  description?: string;
  category?: string;
  level?: string;
  objectives?: string;
  skills_targeted?: string;
  status?: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ContenuFormation {
  id?: number;
  formation?: Formation;
  formation_id?: number;
  title: string;
  content_type?: string;
  content_body?: string;
  order_index?: number;
  evaluation?: Evaluation;
  evaluation_id?: number;
  is_locked?: boolean;
}

export interface Evaluation {
  id?: number;
  formation?: Formation;
  formation_id?: number;
  title: string;
  content?: string;
  evaluation_type?: string;
  passing_score?: number;
  max_attempts?: number;
  linked_content_range?: string;
  created_at?: string;
}

export interface ResultEvaluation {
  id?: number;
  evaluation?: Evaluation;
  evaluation_id: number;
  user_id: number;
  score?: number;
  attempt_number?: number;
  passed?: boolean;
  answered_at?: string;
}

export interface Examen {
  id?: number;
  formation?: Formation;
  formation_id: number;
  title: string;
  duration_minutes?: number;
  passing_score?: number;
  content?: string;
  created_by?: number;
  created_at?: string;
}

export interface ResultExamen {
  id?: number;
  examen?: Examen;
  examen_id: number;
  user_id: number;
  start_time?: string;
  end_time?: string;
  submitted_answers?: string;
  score?: number;
  passed?: boolean;
}

export interface FormationProgressContentItem {
  id: number;
  title: string;
  orderIndex: number;
  unlocked: boolean;
  evaluationPassed: boolean;
  evaluationId?: number;
}

export interface FormationProgressResponse {
  content: FormationProgressContentItem[];
  examEligible: boolean;
  completionPercentage: number;
  formationStatus?: 'IN_PROGRESS' | 'COMPLETED';
}

export interface MistakeExplanationItem {
  questionText: string;
  correctAnswer: string;
  userAnswer: string;
  aiExplanation?: string;
}

export interface EvaluationSubmitResponse {
  score: number;
  passed: boolean;
  remainingAttempts: number;
  attemptNumber: number;
  mistakeExplanations?: MistakeExplanationItem[];
}

export interface EvaluationHistoryItem {
  evaluationId: number;
  evaluationTitle: string;
  formationId?: number;
  attemptNumber: number;
  score?: number;
  passed?: boolean;
  answeredAt?: string;
}

export interface ExamHistoryItem {
  examenId: number;
  examTitle: string;
  formationId?: number;
  score?: number;
  passed?: boolean;
  durationMinutes?: number;
  submittedAt?: string;
}

/* Statistics DTOs */
export interface CompletionRateResponse {
  completionRate: number;
  usersCompleted: number;
  usersAttempted: number;
}

export interface EvaluationSuccessStatsResponse {
  evaluationId: number;
  evaluationTitle: string;
  successRate: number;
  passedAttempts: number;
  totalAttempts: number;
  averageAttempts: number;
}

export interface ScoreDistributionItem {
  range: string;
  count: number;
}

export interface ExamAnalyticsResponse {
  examPassRate: number;
  averageScore: number | null;
  averageCompletionTimeSeconds: number | null;
  scoreDistribution: ScoreDistributionItem[] | null;
}

export interface LearningObstacleResponse {
  evaluationId: number;
  evaluationTitle: string;
  successRate: number;
  averageAttempts: number;
  blockedUsersCount: number;
  explanation: string;
}

export interface GlobalStatisticsOverview {
  completionRate: CompletionRateResponse;
  evaluationSuccess: EvaluationSuccessStatsResponse;
  examAnalytics: ExamAnalyticsResponse;
  learningObstacles: LearningObstacleResponse[];
  totalFormations: number;
}
