import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuizQuestion } from '../../utils/quiz-scoring';

@Component({
  selector: 'app-question-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './question-builder.component.html',
  styleUrl: './question-builder.component.css'
})
export class QuestionBuilderComponent {
  @Input() questions: QuizQuestion[] = [];
  @Output() questionsChange = new EventEmitter<QuizQuestion[]>();

  addQuestion(): void {
    this.questions = [...this.questions, { text: '', options: ['', ''], correctIndex: 0 }];
    this.questionsChange.emit(this.questions);
  }

  removeQuestion(index: number): void {
    this.questions = this.questions.filter((_, i) => i !== index);
    this.questionsChange.emit(this.questions);
  }

  addOption(index: number): void {
    this.questions = this.questions.map((q, i) =>
      i === index ? { ...q, options: [...q.options, ''] } : q
    );
    this.questionsChange.emit(this.questions);
  }

  removeOption(qIndex: number, oIndex: number): void {
    if (this.questions[qIndex].options.length <= 2) return;
    this.questions = this.questions.map((q, i) =>
      i === qIndex
        ? {
            ...q,
            options: q.options.filter((_, oi) => oi !== oIndex),
            correctIndex: q.correctIndex >= oIndex && q.correctIndex > 0 ? q.correctIndex - 1 : q.correctIndex
          }
        : q
    );
    this.questionsChange.emit(this.questions);
  }

  updateQuestion(index: number, field: keyof QuizQuestion, value: string | string[] | number): void {
    this.questions = this.questions.map((q, i) =>
      i === index ? { ...q, [field]: value } : q
    );
    this.questionsChange.emit(this.questions);
  }

  updateOption(qIndex: number, oIndex: number, value: string): void {
    this.questions = this.questions.map((q, i) =>
      i === qIndex
        ? { ...q, options: q.options.map((o, oi) => (oi === oIndex ? value : o)) }
        : q
    );
    this.questionsChange.emit(this.questions);
  }

  setCorrect(qIndex: number, oIndex: number): void {
    this.questions = this.questions.map((q, i) =>
      i === qIndex ? { ...q, correctIndex: oIndex } : q
    );
    this.questionsChange.emit(this.questions);
  }
}
