import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FormationService } from '../../../services/formation.service';
import { EvaluationService } from '../../../services/evaluation.service';
import { Formation, Evaluation } from '../../../models/formation.models';
import { QuestionBuilderComponent } from '../../../components/question-builder/question-builder.component';
import { QuizQuestion, parseStructuredContent, questionsToJson } from '../../../utils/quiz-scoring';

@Component({
  selector: 'app-formation-evaluations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, QuestionBuilderComponent],
  templateUrl: './formation-evaluations.component.html',
  styleUrl: './formation-evaluations.component.css'
})
export class FormationEvaluationsComponent implements OnInit {
  formationId!: number;
  formation: Formation | null = null;
  evaluations: Evaluation[] = [];
  loading = true;
  error: string | null = null;

  showEditModal = false;
  editingEval: Evaluation | null = null;
  editForm: Partial<Evaluation> = {};
  editQuestions: QuizQuestion[] = [];
  saving = false;

  constructor(
    private route: ActivatedRoute,
    private formationService: FormationService,
    private evaluationService: EvaluationService
  ) {}

  ngOnInit(): void {
    this.formationId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.formationId) return;
    this.load();
  }

  load(): void {
    this.formationService.getById(this.formationId).subscribe({
      next: (f) => {
        this.formation = f;
        this.evaluationService.getByFormationId(this.formationId).subscribe({
          next: (e) => {
            this.evaluations = e;
            this.loading = false;
          },
          error: (err) => {
            this.error = err.error?.message || 'Failed to load evaluations';
            this.loading = false;
          }
        });
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load formation';
        this.loading = false;
      }
    });
  }

  openAddEvaluation(): void {
    this.editingEval = null;
    this.editForm = { title: '', passing_score: 75, max_attempts: 3, evaluation_type: 'quiz' };
    this.editQuestions = [{ text: '', options: ['', ''], correctIndex: 0 }];
    this.showEditModal = true;
  }

  openEditEvaluation(evaluation: Evaluation): void {
    this.editingEval = evaluation;
    this.editForm = {
      title: evaluation.title,
      passing_score: evaluation.passing_score ?? 75,
      max_attempts: evaluation.max_attempts ?? 3,
      evaluation_type: evaluation.evaluation_type || 'quiz'
    };
    const parsed = parseStructuredContent(evaluation.content);
    this.editQuestions = parsed?.questions?.length ? parsed.questions : [{ text: '', options: ['', ''], correctIndex: 0 }];
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingEval = null;
    this.editForm = {};
    this.editQuestions = [];
  }

  saveEvaluation(): void {
    if (!this.editForm.title?.trim()) return;
    this.saving = true;
    const content = questionsToJson(this.editQuestions);
    const payload: Evaluation = {
      ...this.editForm,
      title: this.editForm.title!.trim(),
      passing_score: this.editForm.passing_score ?? 75,
      max_attempts: this.editForm.max_attempts ?? 3,
      evaluation_type: 'quiz',
      content,
      formation_id: this.formationId
    } as Evaluation;

    const obs = this.editingEval?.id
      ? this.evaluationService.update(this.editingEval.id, payload)
      : this.evaluationService.create(payload);

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.closeEditModal();
        this.load();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to save';
        this.saving = false;
      }
    });
  }

  delete(id: number): void {
    if (!confirm('Delete this evaluation?')) return;
    this.evaluationService.delete(id).subscribe({
      next: () => this.load(),
      error: (err) => (this.error = err.error?.message || 'Failed to delete')
    });
  }
}
