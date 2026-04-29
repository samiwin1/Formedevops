import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormationService } from '../../../../formation/services/formation.service';
import { Formation } from '../../../../formation/models/formation.models';
import { DocumentService } from '../../../services/document.service';
import { AuthService } from '../../../../../core/services/auth.service';

@Component({
  selector: 'app-document-add',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './document-add.component.html',
  styleUrl: './document-add.component.css',
})
export class DocumentAddComponent implements OnInit {
  private fb = inject(FormBuilder);
  private formationService = inject(FormationService);
  private documentService = inject(DocumentService);
  private authService = inject(AuthService);
  private router = inject(Router);

  formations: Formation[] = [];
  loading = true;
  submitting = false;
  error: string | null = null;
  selectedFile: File | null = null;
  fileError: string | null = null;

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    formationId: [null as number | null, [Validators.required]],
  });

  ngOnInit(): void {
    this.formationService.getAll().subscribe({
      next: (list) => {
        this.formations = (list ?? []).filter((f) => f.id != null);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onFileSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    this.selectedFile = file ?? null;
    this.fileError = null;
  }

  submit(): void {
    this.fileError = null;
    if (!this.selectedFile) {
      this.fileError = 'Please choose a file.';
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const userId = this.authService.getUserId();
    if (userId == null) {
      this.error = 'You must be logged in.';
      return;
    }
    const v = this.form.getRawValue();
    const formationId = v.formationId ?? 0;
    if (formationId <= 0) return;

    this.submitting = true;
    this.error = null;
    this.documentService
      .createDocument({
        title: (v.title ?? '').trim(),
        formationId,
        ownerId: userId,
        ownerType: 'ADMIN',
        file: this.selectedFile,
      })
      .subscribe({
        next: () => this.router.navigate(['/admin/documents/list']),
        error: (err) => {
          this.error = err.error?.message || err.message || 'Failed to upload document';
          this.submitting = false;
        },
      });
  }
}
