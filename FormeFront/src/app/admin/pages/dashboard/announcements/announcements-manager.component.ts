import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AnnouncementService, Announcement, AnnouncementStatus } from './announcement.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-announcements-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './announcements-manager.component.html',
  styleUrl: './announcements-manager.component.css'
})
export class AnnouncementsManagerComponent implements OnInit {
  private readonly svc   = inject(AnnouncementService);
  private readonly toast = inject(ToastService);
  private readonly auth  = inject(AuthService);

  announcements: Announcement[] = [];
  loading      = false;
  submitting   = false;
  errorMessage = '';
  showForm     = false;
  editingId: number | null = null;
  activeTab: AnnouncementStatus | 'ALL' = 'ALL';
  private readonly busy = new Set<number>();

  formTitle   = '';
  formContent = '';
  formPinned  = false;
  formEmail   = '';
  formImageBase64: string | null = null;

  readonly tabs: Array<AnnouncementStatus | 'ALL'> = ['ALL', 'DRAFT', 'PUBLISHED', 'ARCHIVED'];

  // Dynamic getters — computed on each access, reflects current user role
  get canManage(): boolean {
    return this.auth.isSuperAdmin() || this.auth.isAdmin();
  }

  get canPublish(): boolean {
    return this.auth.isSuperAdmin() || this.auth.isAdmin();
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.errorMessage = '';
    this.loading = true;
    this.svc.getAll()
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: data => {
          this.announcements = [...data].sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        },
        error: () => { this.errorMessage = 'Could not load announcements.'; }
      });
  }

  get filtered(): Announcement[] {
    return this.activeTab === 'ALL'
      ? this.announcements
      : this.announcements.filter(a => a.status === this.activeTab);
  }

  get visibleAnnouncements(): Announcement[] {
    if (this.activeTab !== 'ALL' || !this.canManage) {
      return this.filtered;
    }

    return this.filtered.filter(a => a.status !== 'ARCHIVED');
  }

  tabCount(tab: AnnouncementStatus | 'ALL'): number {
    return tab === 'ALL'
      ? this.announcements.length
      : this.announcements.filter(a => a.status === tab).length;
  }

  openNew(): void {
    this.editingId   = null;
    this.formTitle   = '';
    this.formContent = '';
    this.formPinned  = false;
    this.formEmail   = this.auth.getEmail() ?? '';
    this.formImageBase64 = null;
    this.showForm    = true;
  }

  openEdit(a: Announcement): void {
    this.editingId   = a.id;
    this.formTitle   = a.title;
    this.formImageBase64 = this.extractImage(a.content);
    this.formContent = this.stripImage(a.content);
    this.formPinned  = a.pinned;
    this.formEmail   = a.createdByEmail ?? '';
    this.showForm    = true;
  }

  closeForm(): void {
    this.showForm    = false;
    this.editingId   = null;
    this.formTitle   = '';
    this.formContent = '';
    this.formPinned  = false;
    this.formEmail   = '';
    this.formImageBase64 = null;
  }

  submit(): void {
    const title   = this.formTitle.trim();
    const content = this.formContent.trim();
    const builtContent = this.buildContent();
    if (!title || !content || this.submitting) return;

    this.errorMessage = '';
    this.submitting   = true;

    if (this.editingId !== null) {
      const existing = this.announcements.find(a => a.id === this.editingId);
      if (!existing) { this.submitting = false; return; }
      const updated: Announcement = {
        ...existing,
        title,
        content: builtContent,
        pinned:         this.formPinned,
        createdByEmail: this.formEmail.trim() || existing.createdByEmail,
      };
      this.svc.save(updated)
        .pipe(finalize(() => { this.submitting = false; }))
        .subscribe({
          next: () => { this.toast.success('Announcement updated.'); this.closeForm(); this.load(); },
          error: (err: unknown) => { this.handleErr(err, 'Failed to update.'); }
        });
    } else {
      const email = this.formEmail.trim() || this.auth.getEmail() || undefined;
      this.svc.create(title, builtContent, this.formPinned, email)
        .pipe(finalize(() => { this.submitting = false; }))
        .subscribe({
          next: () => { this.toast.success('Draft created.'); this.closeForm(); this.load(); },
          error: (err: unknown) => { this.handleErr(err, 'Failed to create.'); }
        });
    }
  }

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      this.toast.error('Image must be under 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { this.formImageBase64 = reader.result as string; };
    reader.readAsDataURL(file);
  }

  stripImage(content: string): string {
    return content.replace(/<img[^>]*class="announcement-img"[^>]*>/g, '').trim();
  }

  extractImage(content: string): string | null {
    const match = content.match(/<img[^>]*class="announcement-img"[^>]*src="([^"]+)"/);
    return match ? match[1] : null;
  }

  private buildContent(): string {
    const clean = this.stripImage(this.formContent);
    if (!this.formImageBase64) return clean;
    return clean + `<img src="${this.formImageBase64}" class="announcement-img" alt="image">`;
  }

  publish(a: Announcement): void {
    if (!this.canPublish) {
      this.toast.error('Publishing requires a super-admin account.');
      return;
    }

    if (this.busy.has(a.id)) return;

    this.errorMessage = '';
    this.busy.add(a.id);
    this.svc.publish(a.id)
      .pipe(finalize(() => { this.busy.delete(a.id); }))
      .subscribe({
        next: () => {
          const publishedAt = new Date().toISOString();
          const target = this.announcements.find(item => item.id === a.id);

          if (target) {
            target.status = 'PUBLISHED';
            target.publishedAt = publishedAt;
            this.announcements = [...this.announcements];
          }

          this.toast.success('Published.');
        },
        error: (err: unknown) => { this.handleErr(err, 'Could not publish.'); }
      });
  }

  archive(a: Announcement): void {
    if (!this.canPublish) {
      this.toast.error('Archiving requires a super-admin account.');
      return;
    }
    this.mutate({ ...a, status: 'ARCHIVED' }, 'Archived.', 'Could not archive.');
  }

  togglePin(a: Announcement): void {
    this.mutate({ ...a, pinned: !a.pinned }, a.pinned ? 'Unpinned.' : 'Pinned.', 'Could not update pin.');
  }

  confirmDelete(a: Announcement): void {
    if (!confirm(`Delete "${a.title}"? This cannot be undone.`)) return;
    if (this.busy.has(a.id)) return;
    this.errorMessage = '';
    this.busy.add(a.id);
    this.svc.delete(a.id)
      .pipe(finalize(() => { this.busy.delete(a.id); }))
      .subscribe({
        next: () => { this.toast.success('Deleted.'); this.load(); },
        error: (err: unknown) => { this.handleErr(err, 'Could not delete.'); }
      });
  }

  isBusy(id: number): boolean { return this.busy.has(id); }

  statusClass(s: AnnouncementStatus): string {
    return { DRAFT: 'badge-draft', PUBLISHED: 'badge-published', ARCHIVED: 'badge-archived' }[s];
  }

  statusIcon(s: AnnouncementStatus): string {
    return { DRAFT: 'fa-file-alt', PUBLISHED: 'fa-bullhorn', ARCHIVED: 'fa-archive' }[s];
  }

  statusLabel(s: AnnouncementStatus): string {
    return { DRAFT: 'Draft', PUBLISHED: 'Published', ARCHIVED: 'Archived' }[s];
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  trackById(_: number, a: Announcement): number { return a.id; }

  private mutate(a: Announcement, ok: string, fail: string): void {
    if (this.busy.has(a.id)) return;
    this.errorMessage = '';
    this.busy.add(a.id);
    this.svc.save(a)
      .pipe(finalize(() => { this.busy.delete(a.id); }))
      .subscribe({
        next: () => { this.toast.success(ok); this.load(); },
        error: (err: unknown) => { this.handleErr(err, fail); }
      });
  }

  private handleErr(err: unknown, fallback: string): void {
    let detail = '';
    if (err instanceof HttpErrorResponse) {
      if (typeof err.error === 'string' && err.error.trim()) {
        detail = err.error.trim();
      } else {
        const msg = (err.error as { message?: string } | null)?.message;
        detail = (typeof msg === 'string' && msg.trim()) ? msg.trim() : `HTTP ${err.status}`;
      }
    }
    this.errorMessage = detail ? `${fallback} (${detail})` : fallback;
    this.toast.error(this.errorMessage);
  }
}