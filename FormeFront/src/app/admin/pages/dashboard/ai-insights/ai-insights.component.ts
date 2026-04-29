import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatisticsService } from '../../../../features/formation/services/statistics.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-ai-insights',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-insights.component.html',
  styleUrl: './ai-insights.component.css',
})
export class AiInsightsComponent implements OnInit {
  private readonly statisticsService = inject(StatisticsService);

  insights: string | null = null;
  loading = true;
  error = false;
  expanded = false;

  private readonly DUMMY_INSIGHTS = [
    {
      icon: '📈',
      title: 'Strong completion momentum',
      text: 'Angular Advanced and Spring Boot Microservices lead with 87% and 78% completion rates. These formations show strong learner engagement — consider using their structure as a template for new content.',
    },
    {
      icon: '⚠️',
      title: 'Drop-off alert',
      text: 'Machine Learning Basics and Kubernetes Mastery have high abandonment rates (52% and 44%). Review content difficulty around module 3 — that\'s where most learners disengage based on session data.',
    },
    {
      icon: '✅',
      title: 'Assessment performance is healthy',
      text: 'Overall exam pass rate is 72% with an average score of 68.4. The platform is performing well above the 60% industry benchmark for online certification programs.',
    },
    {
      icon: '🎯',
      title: 'Action recommended',
      text: 'Schedule office hours for the 2 high-failure evaluations (ML Final Exam at 58% failure, K8s Networks at 51%). A single live Q&A session typically reduces failure rates by 15–20%.',
    },
  ];

  parsedInsights: { icon: string; title: string; text: string }[] = [];

  ngOnInit(): void {
    this.statisticsService
      .getGlobalAnalyticsWithInsights()
      .pipe(catchError(() => of(null)))
      .subscribe((data) => {
        if (data?.aiInsights) {
          this.insights = data.aiInsights;
          this.parsedInsights = this.parseInsights(data.aiInsights);
          this.error = false;
        } else {
          this.parsedInsights = this.DUMMY_INSIGHTS;
          this.error = data === null;
        }
        this.loading = false;
      });
  }

  private parseInsights(raw: string): { icon: string; title: string; text: string }[] {
    // Try to parse numbered list or bullet points from AI response
    const icons = ['📈', '⚠️', '✅', '🎯', '💡', '🔍'];
    const lines = raw
      .split('\n')
      .map((l) => l.replace(/^[\d\.\-\*\•]+\s*/, '').trim())
      .filter((l) => l.length > 20);

    if (lines.length >= 2) {
      return lines.slice(0, 4).map((line, i) => {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0 && colonIdx < 50) {
          return {
            icon: icons[i % icons.length],
            title: line.slice(0, colonIdx).trim(),
            text: line.slice(colonIdx + 1).trim(),
          };
        }
        return {
          icon: icons[i % icons.length],
          title: `Insight ${i + 1}`,
          text: line,
        };
      });
    }

    // Fallback: show raw text as one block
    return [{ icon: '💡', title: 'AI Analysis', text: raw }];
  }

  get displayInsights() {
    return this.expanded ? this.parsedInsights : this.parsedInsights.slice(0, 2);
  }

  toggle(): void {
    this.expanded = !this.expanded;
  }

  refresh(): void {
    this.loading = true;
    this.error = false;
    this.ngOnInit();
  }
}
