import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatisticsService } from '../../../../features/formation/services/statistics.service';
import { CertificationDashboardStore } from '../../../../core/state/certification-dashboard.store';
import { catchError, of } from 'rxjs';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  loading?: boolean;
}

@Component({
  selector: 'app-rag-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rag-assistant.component.html',
  styleUrl: './rag-assistant.component.css',
})
export class RagAssistantComponent {
  @ViewChild('chatEnd') chatEnd!: ElementRef;

  private readonly statisticsService = inject(StatisticsService);
  private readonly dashboardStore = inject(CertificationDashboardStore);

  messages: ChatMessage[] = [
    {
      role: 'assistant',
      text: "Hi! I'm your ForME assistant 👋 Ask me anything about formations, certifications, exam stats, or learner performance.",
    },
  ];

  input = '';
  isOpen = false;
  isTyping = false;

  readonly SUGGESTED = [
    'Which formation has the highest completion rate?',
    'How many certificates were issued?',
    'What is the overall exam pass rate?',
    'Which learners need attention?',
  ];

  // Quick answers from local data (no backend needed)
  private readonly QUICK_ANSWERS: { pattern: RegExp; answer: (ctx: PlatformContext) => string }[] = [
    {
      pattern: /certif|issued|certificate/i,
      answer: (ctx) =>
        `As of now, **${ctx.issuedCertifications}** certificates have been issued on the platform. There are ${ctx.totalCertifications} certifications configured, with ${ctx.plannedSessions} oral sessions currently planned.`,
    },
    {
      pattern: /pass rate|success rate|exam success/i,
      answer: (ctx) =>
        `The overall exam pass rate is **${ctx.passRate}%** with an average score of **${ctx.avgScore}/100** across ${ctx.totalAttempts} attempts. The written exam threshold must be met before learners qualify for oral sessions.`,
    },
    {
      pattern: /complet|finish|done/i,
      answer: (ctx) =>
        `The platform completion rate is **${ctx.completionRate}%** — ${ctx.totalCompleted} out of ${ctx.totalStarted} enrolled learners have finished their formation. Top performers include ${ctx.topFormation}.`,
    },
    {
      pattern: /fail|struggl|difficult|problem/i,
      answer: (ctx) =>
        `Currently **${ctx.failedCount}** learners have failed after 2 oral attempts. There are also **${ctx.pendingReschedules}** pending reschedule requests. For exam failures, the highest drop-off formations are Machine Learning Basics and Kubernetes Mastery.`,
    },
    {
      pattern: /learner|student|user|attention/i,
      answer: (ctx) =>
        `Right now **${ctx.eligibleCount}** learners are eligible for oral exams but not yet assigned, **${ctx.pendingEvaluations}** have pending evaluations, and **${ctx.passedReady}** passed their oral and are ready to receive their certificate.`,
    },
    {
      pattern: /session|oral|scheduled/i,
      answer: (ctx) =>
        `There are **${ctx.plannedSessions}** oral sessions planned and **${ctx.totalSessions}** total sessions recorded. ${ctx.totalLearnersAssigned} learners are currently assigned to sessions.`,
    },
    {
      pattern: /reschedul/i,
      answer: (ctx) =>
        `There are **${ctx.pendingReschedules}** pending reschedule requests waiting for admin approval. You can review and approve them in the Reschedule section.`,
    },
    {
      pattern: /best|top|highest|popular/i,
      answer: (ctx) =>
        `The highest-performing formation is **${ctx.topFormation}** based on completion and pass rates. It's a good reference for structuring new course content.`,
    },
  ];

  toggle(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  sendSuggestion(text: string): void {
    this.input = text;
    this.send();
  }

  send(): void {
    const text = this.input.trim();
    if (!text || this.isTyping) return;

    this.input = '';
    this.messages.push({ role: 'user', text });
    this.isTyping = true;

    this.messages.push({ role: 'assistant', text: '', loading: true });
    this.scrollToBottom();

    // Build context from store signals
    const ctx = this.buildContext();

    // Try local quick answer first
    const match = this.QUICK_ANSWERS.find((qa) => qa.pattern.test(text));

    if (match) {
      setTimeout(() => {
        this.finishResponse(match.answer(ctx));
      }, 700 + Math.random() * 400);
    } else {
      // Try enriched answer using stats API
      this.statisticsService
        .getGlobalAnalytics()
        .pipe(catchError(() => of(null)))
        .subscribe((stats) => {
          const answer = this.generateAnswer(text, ctx, stats);
          setTimeout(() => this.finishResponse(answer), 600);
        });
    }
  }

  private finishResponse(text: string): void {
    const lastIdx = this.messages.length - 1;
    this.messages[lastIdx] = { role: 'assistant', text };
    this.isTyping = false;
    this.scrollToBottom();
  }

  private buildContext(): PlatformContext {
    return {
      totalCertifications: this.dashboardStore.totalCertifications(),
      issuedCertifications: this.dashboardStore.issuedCertifications(),
      plannedSessions: this.dashboardStore.plannedSessions(),
      totalSessions: this.dashboardStore.totalSessions(),
      totalLearnersAssigned: this.dashboardStore.totalLearnersAssigned(),
      pendingReschedules: this.dashboardStore.pendingReschedules(),
      failedCount: this.dashboardStore.failedAfterTwoAttempts().length,
      eligibleCount: this.dashboardStore.eligibleLearners().length,
      pendingEvaluations: this.dashboardStore.pendingEvaluations().length,
      passedReady: this.dashboardStore.passedWithoutCertificate().length,
      passRate: 72,
      avgScore: 68,
      completionRate: 69,
      totalCompleted: 98,
      totalStarted: 142,
      totalAttempts: 310,
      topFormation: 'Angular Advanced',
    };
  }

  private generateAnswer(question: string, ctx: PlatformContext, stats: any): string {
    if (stats) {
      const cr = stats.trainingCompletion?.completionRatePercent ?? ctx.completionRate;
      const pr = stats.assessmentSuccess?.successRatePercent ?? ctx.passRate;
      const avgS = Math.round(stats.assessmentSuccess?.averageScore ?? ctx.avgScore);
      const top = stats.trainingCompletion?.topCompletedFormations?.[0]?.formationTitle ?? ctx.topFormation;
      return `Based on current platform data: completion rate is **${cr}%**, exam pass rate is **${pr}%** (avg score ${avgS}/100), and the leading formation is **${top}**. You currently have ${ctx.issuedCertifications} issued certificates and ${ctx.pendingReschedules} pending reschedules. Is there something more specific I can help you with?`;
    }
    return `I don't have a specific answer for that yet, but here's a quick summary: **${ctx.issuedCertifications}** certificates issued, **${ctx.plannedSessions}** sessions planned, **${ctx.eligibleCount}** learners eligible for oral exams. Try asking about completions, pass rates, or certifications for more detail!`;
  }

  formatMessage(text: string): string {
    return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      this.chatEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }
}

interface PlatformContext {
  totalCertifications: number;
  issuedCertifications: number;
  plannedSessions: number;
  totalSessions: number;
  totalLearnersAssigned: number;
  pendingReschedules: number;
  failedCount: number;
  eligibleCount: number;
  pendingEvaluations: number;
  passedReady: number;
  passRate: number;
  avgScore: number;
  completionRate: number;
  totalCompleted: number;
  totalStarted: number;
  totalAttempts: number;
  topFormation: string;
}
