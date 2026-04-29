import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FormationService, GenerateFormationRequest } from '../../../services/formation.service';
import { EvaluationService } from '../../../services/evaluation.service';
import { ExamService } from '../../../services/exam.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { Formation, ContenuFormation, Evaluation, Examen } from '../../../models/formation.models';
import { QuizQuestion, questionsToJson } from '../../../utils/quiz-scoring';
import { QuestionBuilderComponent } from '../../../components/question-builder/question-builder.component';
import { AgentThinkingAnimationComponent } from '../../../components/agent-thinking-animation/agent-thinking-animation.component';

@Component({
  selector: 'app-formation-create',
  standalone: true,
  imports: [CommonModule, FormsModule, QuestionBuilderComponent, AgentThinkingAnimationComponent],
  templateUrl: './formation-create.component.html',
  styleUrl: './formation-create.component.css'
})
export class FormationCreateComponent {
  step = 1;
  categoryOptions = ['Web', 'Mobile', 'Data', 'Cloud', 'General'];
  levelOptions = ['Beginner', 'Intermediate', 'Advanced'];

  formation: Partial<Formation> = {
    title: '',
    description: '',
    category: '',
    level: '',
    objectives: '',
    skills_targeted: '',
    status: 'draft'
  };
  formationId: number | null = null;
  contentBlocks: Partial<ContenuFormation>[] = [];
  evaluations: Partial<Evaluation>[] = [];
  exam: Partial<Examen> = {
    title: '',
    duration_minutes: 60,
    passing_score: 75,
    content: ''
  };
  currentContent: Partial<ContenuFormation> = { title: '', content_type: 'text', content_body: '', order_index: 0 };
  currentEvaluation: Partial<Evaluation> = { title: '', content: '', passing_score: 75, max_attempts: 3 };
  quizQuestions: QuizQuestion[] = [];
  examQuestions: QuizQuestion[] = [];
  loading = false;
  error: string | null = null;

  showAiBlocksModal = false;
  aiBlocksCount = 3;
  aiGenerateError: string | null = null;

  constructor(
    private router: Router,
    private formationService: FormationService,
    private evaluationService: EvaluationService,
    private examService: ExamService,
    private authService: AuthService
  ) {}

  nextStep(): void {
    this.error = null;
    if (this.step === 1) {
      this.createFormation();
    } else if (this.step === 2) {
      this.addContentBlock();
    } else if (this.step === 3) {
      this.addEvaluation();
    } else if (this.step === 4) {
      this.addContentBlock();
    } else if (this.step === 5) {
      this.createExam();
    } else if (this.step === 6) {
      this.publishAndFinish();
    }
  }

  private createFormation(): void {
    if (!this.formation.title?.trim()) {
      this.error = 'Title is required';
      return;
    }
    this.loading = true;
    const createdBy = this.authService.getUserId();
    this.formationService.create({
      ...this.formation,
      created_by: createdBy ?? undefined,
      status: 'draft'
    } as Formation).subscribe({
      next: (f) => {
        this.formationId = f.id!;
        this.step = 2;
        this.currentContent = { title: '', content_type: 'text', content_body: '', order_index: 0 };
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to create formation';
        this.loading = false;
      }
    });
  }

  private addContentBlock(): void {
    if (!this.formationId || !this.currentContent.title?.trim()) {
      this.error = 'Content title is required';
      return;
    }
    this.loading = true;
    this.formationService.createContent({
      formation: { id: this.formationId },
      formation_id: this.formationId,
      title: this.currentContent.title,
      content_type: this.currentContent.content_type || 'text',
      content_body: this.currentContent.content_body ?? '',
      order_index: this.contentBlocks.length,
      is_locked: this.contentBlocks.length > 0
    } as ContenuFormation).subscribe({
      next: (c) => {
        this.contentBlocks.push(c);
        this.currentContent = { title: '', content_type: 'text', content_body: '', order_index: this.contentBlocks.length };
        this.currentEvaluation = { title: '', content: '', passing_score: 75, max_attempts: 3 };
        this.step = this.step === 2 ? 3 : 3;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to add content';
        this.loading = false;
      }
    });
  }

  private addEvaluation(): void {
    if (!this.formationId || !this.currentEvaluation.title?.trim()) {
      this.error = 'Evaluation title is required';
      return;
    }
    this.loading = true;
    const evalContent = this.quizQuestions.length > 0 ? questionsToJson(this.quizQuestions) : (this.currentEvaluation.content ?? '');
    this.evaluationService.create({
      formation: { id: this.formationId },
      formation_id: this.formationId,
      title: this.currentEvaluation.title,
      content: evalContent,
      passing_score: this.currentEvaluation.passing_score ?? 75,
      max_attempts: this.currentEvaluation.max_attempts ?? 3
    } as Evaluation).subscribe({
      next: (e) => {
        this.evaluations.push(e);
        const lastContent = this.contentBlocks[this.contentBlocks.length - 1];
        if (lastContent?.id) {
          this.formationService.updateContent(lastContent.id!, {
            ...lastContent,
            formation: { id: this.formationId },
            formation_id: this.formationId,
            evaluation: { id: e.id },
            evaluation_id: e.id
          } as ContenuFormation).subscribe();
        }
        this.currentEvaluation = { title: '', content: '', passing_score: 75, max_attempts: 3 };
        this.quizQuestions = [];
        this.currentContent = { title: '', content_type: 'text', content_body: '', order_index: this.contentBlocks.length };
        this.step = 4;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to add evaluation';
        this.loading = false;
      }
    });
  }

  private createExam(): void {
    if (!this.formationId || !this.exam.title?.trim()) {
      this.error = 'Exam title is required';
      return;
    }
    this.loading = true;
    const createdBy = this.authService.getUserId();
    const examContent = this.examQuestions.length > 0 ? questionsToJson(this.examQuestions) : (this.exam.content ?? '');
    this.examService.create({
      formation: { id: this.formationId },
      formation_id: this.formationId,
      title: this.exam.title,
      duration_minutes: this.exam.duration_minutes ?? 60,
      passing_score: this.exam.passing_score ?? 75,
      content: examContent,
      created_by: createdBy ?? undefined
    } as Examen).subscribe({
      next: () => {
        this.step = 6;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to create exam';
        this.loading = false;
      }
    });
  }

  private publishAndFinish(): void {
    if (!this.formationId) return;
    this.loading = true;
    this.formationService.update(this.formationId, { ...this.formation, status: 'published' } as Formation).subscribe({
      next: () => {
        this.router.navigate(['/admin/formations']);
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to publish';
        this.loading = false;
      }
    });
  }

  goToExamStep(): void {
    this.step = 5;
  }

  back(): void {
    if (this.step > 1) this.step--;
  }

  openAiGenerateModal(): void {
    if (!this.formation.title?.trim()) {
      this.error = 'Title is required for AI generation';
      return;
    }
    this.aiGenerateError = null;
    this.aiBlocksCount = 3;
    this.showAiBlocksModal = true;
  }

  closeAiBlocksModal(): void {
    this.showAiBlocksModal = false;
    this.aiGenerateError = null;
  }

  generateWithAiFromStep1(): void {
    if (!this.formation.title?.trim()) return;
    this.aiGenerateError = null;
    this.loading = true;
    const request: GenerateFormationRequest = {
      title: this.formation.title.trim(),
      description: this.formation.description?.trim() || undefined,
      objectives: this.formation.objectives?.trim() || undefined,
      level: this.formation.level?.toLowerCase() || 'intermediate',
      skillsTargeted: this.formation.skills_targeted?.trim() || undefined,
      numberOfContentBlocks: Math.min(10, Math.max(1, this.aiBlocksCount || 3)),
      createdBy: this.authService.getUserId() ?? undefined
    };
    this.formationService.generateWithAi(request).subscribe({
      next: () => {
        this.loading = false;
        this.closeAiBlocksModal();
        this.router.navigate(['/admin/formations']);
      },
      error: (err) => {
        this.loading = false;
        if (err?.status === 404) {
          this.aiGenerateError = 'Endpoint not found. Restart formation-service and api-gateway, then try again.';
        } else {
          const msg = (typeof err?.error === 'object' && err?.error?.message) ? String(err.error.message) : (err?.error ? String(err.error) : '');
          if (msg.toLowerCase().includes('api key') && (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('renew') || msg.toLowerCase().includes('invalid'))) {
            this.aiGenerateError = 'API key expired or invalid. Renew it at https://aistudio.google.com/app/apikey then set gemini.api.key in formation-service (application.properties or env GEMINI_API_KEY) and restart the service.';
          } else {
            this.aiGenerateError = msg || 'AI generation failed. Check API key and try again.';
          }
        }
      }
    });
  }
}
