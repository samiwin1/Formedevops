import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FormationService } from '../../../services/formation.service';
import { ExamService } from '../../../services/exam.service';
import { Formation, Examen } from '../../../models/formation.models';
import { QuestionBuilderComponent } from '../../../components/question-builder/question-builder.component';
import { QuizQuestion, parseStructuredContent, questionsToJson } from '../../../utils/quiz-scoring';
import { AuthService } from '../../../../../core/services/auth.service';

@Component({
  selector: 'app-formation-exam',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, QuestionBuilderComponent],
  templateUrl: './formation-exam.component.html',
  styleUrl: './formation-exam.component.css'
})
export class FormationExamComponent implements OnInit {
  formationId!: number;
  formation: Formation | null = null;
  exam: Examen | null = null;
  loading = true;
  error: string | null = null;

  showEditModal = false;
  isCreating = false;
  editForm: Partial<Examen> = {};
  editQuestions: QuizQuestion[] = [];
  saving = false;

  constructor(
    private route: ActivatedRoute,
    private formationService: FormationService,
    private examService: ExamService,
    private authService: AuthService
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
        this.examService.getByFormationId(this.formationId).subscribe({
          next: (e) => {
            this.exam = e;
            this.loading = false;
          },
          error: (err) => {
            this.error = err.error?.message || 'Failed to load exam';
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

  openAddExam(): void {
    this.isCreating = true;
    this.editForm = {
      title: 'Final Exam',
      duration_minutes: 60,
      passing_score: 75,
      formation_id: this.formationId,
      created_by: this.authService.getUserId() ?? undefined
    };
    this.editQuestions = [{ text: '', options: ['', ''], correctIndex: 0 }];
    this.showEditModal = true;
  }

  openEditExam(): void {
    if (!this.exam) return;
    this.isCreating = false;
    this.editForm = {
      title: this.exam.title,
      duration_minutes: this.exam.duration_minutes ?? 60,
      passing_score: this.exam.passing_score ?? 75
    };
    const parsed = parseStructuredContent(this.exam.content);
    this.editQuestions = parsed?.questions?.length ? parsed.questions : [{ text: '', options: ['', ''], correctIndex: 0 }];
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.isCreating = false;
    this.editForm = {};
    this.editQuestions = [];
  }

  saveExam(): void {
    if (!this.editForm.title?.trim()) return;
    this.saving = true;
    const content = questionsToJson(this.editQuestions);
    const payload: Examen = {
      ...this.editForm,
      title: this.editForm.title!.trim(),
      duration_minutes: this.editForm.duration_minutes ?? 60,
      passing_score: this.editForm.passing_score ?? 75,
      content,
      formation_id: this.formationId,
      created_by: this.authService.getUserId() ?? this.exam?.created_by
    } as Examen;

    const obs = this.isCreating || !this.exam?.id
      ? this.examService.create(payload)
      : this.examService.update(this.exam!.id!, payload);

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

  delete(): void {
    if (!this.exam?.id || !confirm('Delete this exam?')) return;
    this.examService.delete(this.exam.id).subscribe({
      next: () => this.load(),
      error: (err) => (this.error = err.error?.message || 'Failed to delete')
    });
  }
}
