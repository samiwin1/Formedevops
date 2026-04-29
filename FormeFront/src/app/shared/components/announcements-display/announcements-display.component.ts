import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AnnouncementService,
  Announcement
} from '../../../admin/pages/dashboard/announcements/announcement.service';

@Component({
  selector: 'app-announcements-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './announcements-display.component.html',
  styleUrl: './announcements-display.component.css'
})
export class AnnouncementsDisplayComponent implements OnInit {
  private readonly svc = inject(AnnouncementService);

  announcements: Announcement[] = [];
  loading = false;
  errorMessage = '';
  selectedAnnouncement: Announcement | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.errorMessage = '';
    this.loading = true;
    this.svc.getPublished().pipe(
      finalize(() => { this.loading = false; })
    ).subscribe({
      next: (data) => {
        this.announcements = [...data].sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return new Date(b.publishedAt || b.createdAt).getTime() - 
                 new Date(a.publishedAt || a.createdAt).getTime();
        });
      },
      error: (err: HttpErrorResponse) => {
        // In some roles/environments, only admin routes exist and can return 403/404.
        // Keep profile page usable with empty state instead of hard error.
        if (err.status === 403 || err.status === 404) {
          this.announcements = [];
          this.errorMessage = '';
          return;
        }
        this.errorMessage = 'Unable to load announcements. Please try again.';
      }
    });
  }

  selectAnnouncement(a: Announcement): void {
    this.selectedAnnouncement = a;
  }

  closeDetail(): void {
    this.selectedAnnouncement = null;
  }

  getTextContent(content: string): string {
    return content.replace(/<img[^>]*>/g, '').trim();
  }

  getImageUrl(content: string): string | null {
    const match = content.match(/<img[^>]*src="(data:[^"]+)"/);
    return match ? match[1] : null;
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  trackByAnnouncementId(_: number, a: Announcement): number {
    return a.id;
  }
}
