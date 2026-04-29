import { CommonModule } from '@angular/common';
import { Component, Input, signal } from '@angular/core';
import { LinkedInPostService } from '../../../core/services/linkedin-post.service';

@Component({
  selector: 'app-linkedin-post-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (!generatedPost() && !loading()) {
      <div class="li-card">
        <div class="li-header">
          <div class="li-icon">in</div>
          <div>
            <div class="li-title">Share your achievement</div>
            <div class="li-sub">
              Let your network know about {{ certificationTitle }}
            </div>
          </div>
        </div>
        <button class="btn-gen" (click)="generate()">
          ✨ Generate LinkedIn post with AI
        </button>
      </div>
    }

    @if (loading()) {
      <div class="li-loading">
        <div class="spinner"></div>
        <span>AI is writing your post...</span>
      </div>
    }

    @if (generatedPost() && !loading()) {
      <div class="li-card">
        <div class="li-header-row">
          <div class="li-header">
            <div class="li-icon">in</div>
            <span class="ai-badge">✨ AI Generated</span>
          </div>
        </div>
        <textarea
          class="post-area"
          [value]="editablePost()"
          (input)="updatePost($event)"
          rows="8"
        ></textarea>
        <div class="char-count">{{ editablePost().length }} / 3000</div>
        <div class="li-actions">
          <button class="btn-regen" (click)="generate()">🔄 Regenerate</button>
          <button class="btn-copy" (click)="copy()">
            {{ copied() ? '✅ Copied!' : '📋 Copy' }}
          </button>
          <button class="btn-post" (click)="openLinkedIn()">
            <span class="in-logo">in</span> Post on LinkedIn
          </button>
        </div>
      </div>
    }

    @if (error()) {
      <div class="li-error">
        ⚠️ {{ error() }}
        <button (click)="generate()">Retry</button>
      </div>
    }
  `,
  styles: [
    `
      .li-card {
        border: 2px solid #0077b5;
        border-radius: 16px;
        padding: 24px;
        background: linear-gradient(135deg, #ffffff, #f0f9ff);
        margin-top: 16px;
        box-shadow: 0 4px 16px rgba(0, 119, 181, 0.12);
        transition: all 0.3s ease;
      }
      .li-card:hover {
        box-shadow: 0 8px 24px rgba(0, 119, 181, 0.2);
        transform: translateY(-2px);
      }
      .li-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }
      .li-header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      .li-icon {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #0077b5, #005885);
        color: white;
        font-weight: 800;
        font-size: 18px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 4px 12px rgba(0, 119, 181, 0.3);
      }
      .li-title {
        font-weight: 700;
        font-size: 15px;
        color: #1a202c;
      }
      .li-sub {
        font-size: 13px;
        color: #718096;
        margin-top: 2px;
      }
      .ai-badge {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 5px 12px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 700;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .btn-gen {
        width: 100%;
        background: linear-gradient(135deg, #0077b5, #005885);
        color: white;
        border: none;
        padding: 14px;
        border-radius: 12px;
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 119, 181, 0.25);
      }
      .btn-gen:hover {
        background: linear-gradient(135deg, #005885, #004060);
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 119, 181, 0.35);
      }
      .btn-gen:active {
        transform: translateY(0);
      }
      .post-area {
        width: 100%;
        border: 2px solid #e2e8f0;
        border-radius: 10px;
        padding: 14px;
        font-size: 13px;
        line-height: 1.7;
        color: #2d3748;
        resize: vertical;
        background: white;
        font-family: inherit;
        box-sizing: border-box;
        transition: all 0.2s ease;
      }
      .post-area:focus {
        outline: none;
        border-color: #0077b5;
        box-shadow: 0 0 0 4px rgba(0, 119, 181, 0.1);
      }
      .char-count {
        text-align: right;
        font-size: 11px;
        color: #a0aec0;
        margin: 6px 0 14px;
        font-weight: 600;
      }
      .li-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        align-items: center;
      }
      .btn-regen,
      .btn-copy {
        background: white;
        border: 2px solid #e2e8f0;
        color: #4a5568;
        padding: 9px 16px;
        border-radius: 10px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        transition: all 0.2s ease;
      }
      .btn-regen:hover,
      .btn-copy:hover {
        border-color: #cbd5e0;
        background: #f7fafc;
        transform: translateY(-1px);
      }
      .btn-post {
        margin-left: auto;
        background: linear-gradient(135deg, #0077b5, #005885);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 10px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 119, 181, 0.25);
      }
      .btn-post:hover {
        background: linear-gradient(135deg, #005885, #004060);
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 119, 181, 0.35);
      }
      .li-loading {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 24px;
        color: #4a5568;
        font-size: 14px;
        font-weight: 600;
        background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
        border: 2px solid #bae6fd;
        border-radius: 12px;
        margin-top: 16px;
      }
      .spinner {
        width: 24px;
        height: 24px;
        border: 3px solid #e0f2fe;
        border-top-color: #0077b5;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .li-error {
        background: #fff5f5;
        border: 2px solid #feb2b2;
        color: #c53030;
        padding: 14px 18px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 600;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 16px;
      }
      .li-error button {
        background: #c53030;
        color: white;
        border: none;
        padding: 6px 14px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 12px;
      }
      .in-logo {
        font-weight: 800;
        font-size: 15px;
      }
    `,
  ],
})
export class LinkedInPostCardComponent {
  @Input({ required: true }) issuedCertificationId!: number;
  @Input({ required: true }) certificationTitle!: string;

  readonly generatedPost = signal<string | null>(null);
  readonly linkedInShareUrl = signal<string | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly copied = signal(false);
  readonly editablePost = signal('');

  constructor(private readonly linkedInPostService: LinkedInPostService) {}

  generate(): void {
    this.loading.set(true);
    this.error.set(null);
    this.linkedInPostService.generatePost(this.issuedCertificationId).subscribe({
      next: (res) => {
        this.generatedPost.set(res.generatedPost);
        this.editablePost.set(res.generatedPost);
        this.linkedInShareUrl.set(res.linkedInShareUrl);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not generate post. Please try again.');
        this.loading.set(false);
      },
    });
  }

  copy(): void {
    navigator.clipboard.writeText(this.editablePost()).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2500);
    });
  }

  openLinkedIn(): void {
    const postText = this.editablePost();
    // Encode the post text for URL
    const encodedText = encodeURIComponent(postText);
    // LinkedIn share URL with pre-filled text
    const linkedInUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodedText}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=600');
  }

  updatePost(event: Event): void {
    this.editablePost.set((event.target as HTMLTextAreaElement).value);
  }
}

