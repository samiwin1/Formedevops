export type CertificationStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type MeetingProvider = 'MEET' | 'TEAMS';
export type OralSessionStatus = 'PLANNED' | 'DONE' | 'CANCELED';
export type AssignmentStatus =
  | 'ASSIGNED'
  | 'RESCHEDULE_REQUESTED'
  | 'RESCHEDULED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'NO_SHOW';
export type RescheduleStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Certification {
  id: number;
  title: string;
  domain?: string;
  provider?: string;
  level?: string;
  validityMonths: number;
  thresholdFinal: number;
  weightWritten: number;
  weightOral: number;
  status: CertificationStatus;
}

export interface CreateCertificationRequest {
  title: string;
  domain?: string;
  provider?: string;
  level?: string;
  validityMonths: number;
  thresholdFinal: number;
  weightWritten: number;
  weightOral: number;
}

export interface UpdateCertificationRequest extends CreateCertificationRequest {}

export interface OralSession {
  id: number;
  certificationId: number;
  certificationTitle: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingProvider: MeetingProvider;
  meetingLink: string;
  evaluatorId: number;
  evaluatorName?: string;
  status: OralSessionStatus;
  learnerCount?: number | null;
}

export interface AdminDashboardStats {
  totalCertifications: number;
  oralSessionsPlanned: number;
  learnersAssigned: number;
  issuedCertifications: number;
  pendingReschedules: number;
}

export interface RescheduleAdminItem {
  id: number;
  assignmentId: number;
  learnerId: number;
  learnerName: string;
  sessionId: number;
  sessionScheduledAt: string;
  proposedDatetime: string;
  message: string;
  requestedAt: string;
  status: RescheduleStatus;
}

export interface EvaluatorOverview {
  sessionsTodayCount: number;
  learnersToEvaluateCount: number;
  sessionsToday: Array<{
    id: number;
    title: string;
    scheduledAt: string;
    learnerCount: number;
  }>;
}

export interface CreateOralSessionRequest {
  certificationId: number;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingProvider: MeetingProvider;
  meetingLink: string;
  evaluatorId: number;
}

export interface UpdateOralSessionRequest extends CreateOralSessionRequest {
  status: OralSessionStatus;
}

export interface OralAssignment {
  id: number;
  oralSessionId: number;
  learnerId: number;
  formationId?: number;
  status: AssignmentStatus;
  oralScore?: number;
  evaluatorComment?: string;
  gradedAt?: string;
  attemptNumber?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAssignmentRequest {
  oralSessionId: number;
  learnerId: number;
  formationId: number;
}

export interface GradeAssignmentRequest {
  oralScore: number;
  evaluatorComment?: string;
  formationId: number;
}

export interface CreateRescheduleRequest {
  proposedDatetime: string;
  message: string;
}

export interface RescheduleResponse {
  id: number;
  assignmentId: number;
  proposedDatetime: string;
  message: string;
  requestedAt: string;
  decidedAt?: string;
  adminComment?: string;
  status: RescheduleStatus;
}

export interface IssuedCertification {
  id: number;
  learnerId: number;
  certificationId: number;
  formationId: number;
  writtenScore: number;
  oralScore: number;
  finalScore: number;
  issuedAt: string;
  expiresAt: string;
  certificateNumber: string;
  status: 'ISSUED' | 'REVOKED';
  pdfPath?: string;
}

export interface EligibleLearner {
  learnerId: number;
  learnerName: string;
  formationId: number;
  formationTitle?: string;
  writtenScore: number;
  passed: boolean;
}

export interface PendingOralEvaluation {
  assignmentId: number;
  learnerId: number;
  learnerName: string;
  attemptNumber?: number;
  oralSessionId: number;
  certificationTitle?: string;
  scheduledAt: string;
  meetingLink: string;
  evaluatorId: number;
  evaluatorName?: string;
  status: string;
}

export interface PassedOralWithoutCertificate {
  assignmentId: number;
  learnerId: number;
  learnerName: string;
  oralSessionId: number;
  certificationId: number;
  formationId: number;
  oralScore: number;
  status: string;
}

export interface FailedOralAttempt {
  assignmentId: number;
  learnerId: number;
  learnerName: string;
  oralSessionId: number;
  certificationId: number;
  formationId: number;
  attemptNumber?: number;
  oralScore?: number;
  status: string;
}

export interface MyExamStatus {
  formationId: number | null;
  writtenScore: number | null;
  writtenPassed: boolean | null;
  oralStatus: 'NOT_ASSIGNED' | 'ASSIGNED' | 'COMPLETED' | string;
  oralScheduledAt: string | null;
  meetingLink: string | null;
  oralScore: number | null;
}

export interface MyCertificationStatus {
  status: 'IN_PROGRESS' | 'FAILED' | 'PASSED' | string;
  issuedCertificationId: number | null;
  certificateNumber: string | null;
  finalScore: number | null;
  pdfPath: string | null;
  downloadable: boolean;
}

export interface SubmitFeedbackRequest {
  sessionRating: number;        // 1-5
  evaluatorRating: number;      // 1-5
  comment?: string;
  issuedCertificationId: number;
  sessionId: number;
}

export interface FeedbackResponse {
  id: number;
  learnerId: number;
  sessionId: number;
  issuedCertificationId: number;
  sessionRating: number;
  evaluatorRating: number;
  comment?: string | null;
  submittedAt: string;
}

export interface PendingFeedbackDto {
  hasPending: boolean;
  issuedCertificationId: number | null;
  sessionId: number | null;
}

export interface SessionFeedbackSummaryDto {
  sessionId: number;
  sessionTitle: string;
  avgSessionRating: number;
  avgEvaluatorRating: number;
  totalFeedbacks: number;
}

export interface LinkedInPostRequest {
  issuedCertificationId: number;
}

export interface LinkedInPostResponse {
  issuedCertificationId: number;
  generatedPost: string;
  certificationTitle: string;
  linkedInShareUrl: string;
}

// Evaluator-specific interfaces
export interface EvaluatorAssignmentDto {
  assignmentId: number;
  learnerId: number;
  learnerName: string;
  status: AssignmentStatus;
  oralScore: number | null;
  oralComment: string | null;
  gradedAt: string | null;
  canGrade: boolean;
}

export interface EvaluatorSessionDto {
  sessionId: number;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingLink: string;
  meetingProvider: string;
  certificationTitle: string;
  status: OralSessionStatus;
  assignments: EvaluatorAssignmentDto[];
}

export interface GradeSubmissionRequest {
  oralScore: number;
  oralComment?: string;
}
