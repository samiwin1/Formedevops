import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormationService } from '../../../../formation/services/formation.service';
import { Formation } from '../../../../formation/models/formation.models';
import { DocumentService } from '../../../services/document.service';
import { AuthService } from '../../../../../core/services/auth.service';

@Component({
  selector: 'app-document-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './document-edit.component.html',
  styleUrl: './document-edit.component.css',
})
export class DocumentEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private formationService = inject(FormationService);
  private documentService = inject(DocumentService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  formations: Formation[] = [];
  loading = true;
  notFound = false;
  submitting = false;
  error: string | null = null;
  documentId: number | null = null;
  currentFileName: string | null = null;
  selectedFile: File | null = null;

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    formationId: [null as number | null, [Validators.required]],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.documentId = id ? +id : null;
    if (this.documentId == null || isNaN(this.documentId)) {
      this.router.navigate(['/admin/documents/list']);
      return;
    }

    this.formationService.getAll().subscribe({
      next: (list) => {
        this.formations = (list ?? []).filter((f) => f.id != null);
      },
      error: () => {},
    });

    this.documentService.getDocument(this.documentId).subscribe({
      next: (doc) => {
        this.form.patchValue({
          title: doc.title ?? '',
          formationId: doc.formationId ?? null,
        });
        this.currentFileName = doc.fileName ?? null;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || err.message || 'Document not found';
        this.notFound = true;
        this.loading = false;
      },
    });
  }

  onFileSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  submit(): void {
    if (this.form.invalid || this.documentId == null) {
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
      .updateDocument(this.documentId, {
        title: (v.title ?? '').trim(),
        formationId,
        ownerId: userId,
        ownerType: 'ADMIN',
        file: this.selectedFile ?? undefined,
      })
      .subscribe({
        next: () => this.router.navigate(['/admin/documents/list']),
        error: (err) => {
          this.error = err.error?.message || err.message || 'Failed to update document';
          this.submitting = false;
        },
      });
  }
}
