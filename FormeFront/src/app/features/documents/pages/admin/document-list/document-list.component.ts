import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DocumentService } from '../../../services/document.service';
import { FormationService } from '../../../../formation/services/formation.service';
import { AdminDocument } from '../../../models/document.models';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './document-list.component.html',
  styleUrl: './document-list.component.css',
})
export class DocumentListComponent implements OnInit {
  private documentService = inject(DocumentService);
  private formationService = inject(FormationService);

  documents: AdminDocument[] = [];
  formationTitles = new Map<number, string>();
  loading = true;
  error: string | null = null;
  deletingId: number | null = null;
  searchTerm = '';
  deleteError: string | null = null;

  ngOnInit(): void {
    this.load();
    this.formationService.getAll().subscribe({
      next: (list) => (list ?? []).forEach((f) => {
        if (f.id != null) this.formationTitles.set(f.id, f.title ?? '');
      }),
      error: () => {},
    });
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.deleteError = null;
    this.documentService.listDocuments().subscribe({
      next: (list) => {
        this.documents = Array.isArray(list) ? list : [];
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || err.message || 'Failed to load documents';
        this.loading = false;
      },
    });
  }

  get filteredDocuments(): AdminDocument[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.documents;
    return this.documents.filter((d) => {
      const title = (d.title || '').toLowerCase();
      const fileName = (d.fileName || '').toLowerCase();
      const type = (d.fileType || '').toLowerCase();
      const fid = (d.formationId ?? '').toString();
      const formTitle = (d.formationId != null ? this.formationTitles.get(d.formationId) || '' : '').toLowerCase();
      const id = (d.id ?? '').toString();
      return (
        title.includes(term) ||
        fileName.includes(term) ||
        type.includes(term) ||
        fid.includes(term) ||
        id.includes(term) ||
        formTitle.includes(term)
      );
    });
  }

  formationLabel(formationId?: number): string {
    if (formationId == null) return 'â€”';
    return this.formationTitles.get(formationId) || `Formation #${formationId}`;
  }

  displayFileType(doc: AdminDocument): string {
    const raw = `${doc.fileType || ''}`.toUpperCase();
    const fileName = `${doc.fileName || ''}`.toLowerCase();

    if (fileName.endsWith('.pptx') || fileName.endsWith('.ppt')) return 'PPT';
    if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) return 'WORD';
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) return 'EXCEL';
    if (fileName.endsWith('.odt')) return 'ODT';
    if (fileName.endsWith('.ods')) return 'ODS';
    if (fileName.endsWith('.odp')) return 'ODP';
    if (fileName.endsWith('.pdf')) return 'PDF';
    if (/\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(fileName)) return 'IMAGE';
    if (/\.(mp4|avi|mov|mkv|webm)$/i.test(fileName)) return 'VIDEO';

    return raw || 'OTHER';
  }

  deleteDocument(doc: AdminDocument): void {
    const id = doc.id;
    if (id == null) return;
    if (!confirm(`Delete document "${doc.title || doc.fileName}"?`)) return;
    this.deletingId = id;
    this.documentService.deleteDocument(id).subscribe({
      next: () => {
        this.documents = this.documents.filter((d) => d.id !== id);
        this.deletingId = null;
      },
      error: (err) => {
        this.deleteError = err?.error?.message ?? err?.message ?? 'Failed to delete';
        this.deletingId = null;
      },
    });
  }
}
