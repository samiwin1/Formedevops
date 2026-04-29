import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, inject } from '@angular/core';
import { AssignmentService } from '../../../core/services/assignment.service';
import { SafeResourceUrlPipe } from '../../../core/pipes/safe-resource-url.pipe';

/**
 * Displays a certificate PDF in an iframe (blob URL).
 * Fetches the PDF from the API and shows it; revokes the blob URL on destroy.
 */
@Component({
  standalone: true,
  selector: 'app-pdf-viewer',
  imports: [CommonModule, SafeResourceUrlPipe],
  template: `
    <div class="pdf-viewer-wrapper">
      <iframe
        *ngIf="pdfUrl"
        [src]="pdfUrl | safeResourceUrl"
        class="pdf-iframe"
        title="Certificate PDF">
      </iframe>
      <div *ngIf="loading" class="pdf-loading">Loading PDF…</div>
      <div *ngIf="error" class="pdf-error alert alert-danger">{{ error }}</div>
    </div>
  `,
  styles: [`
    .pdf-viewer-wrapper { position: relative; min-height: 400px; }
    .pdf-iframe { width: 100%; height: 70vh; min-height: 400px; border: none; }
    .pdf-loading, .pdf-error { padding: 1rem; text-align: center; }
  `],
})
export class PdfViewerComponent implements OnChanges, OnDestroy {
  private readonly assignmentService = inject(AssignmentService);

  @Input() certificationId: number | null = null;

  pdfUrl: string | null = null;
  loading = false;
  error: string | null = null;

  private blobUrl: string | null = null;

  ngOnChanges(): void {
    this.loadPdf();
  }

  ngOnDestroy(): void {
    this.revokeBlobUrl();
  }

  private loadPdf(): void {
    this.revokeBlobUrl();
    this.pdfUrl = null;
    this.error = null;

    if (this.certificationId == null) {
      return;
    }

    this.loading = true;
    this.assignmentService.downloadCertificatePdf(this.certificationId).subscribe({
      next: (blob: Blob) => {
        this.loading = false;
        this.blobUrl = URL.createObjectURL(blob);
        this.pdfUrl = this.blobUrl;
      },
      error: (err: unknown) => {
        this.loading = false;
        this.error = (err as { error?: { message?: string } })?.error?.message || 'Failed to load PDF';
      },
    });
  }

  private revokeBlobUrl(): void {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }
  }
}
