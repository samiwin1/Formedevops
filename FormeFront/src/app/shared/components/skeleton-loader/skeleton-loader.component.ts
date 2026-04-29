import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-container">
      <div *ngFor="let item of items" class="skeleton-card">
        <div class="skeleton skeleton-avatar"></div>
        <div class="skeleton-content">
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text" style="width: 70%;"></div>
          <div class="skeleton skeleton-text" style="width: 50%;"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .skeleton-container {
      display: grid;
      gap: 20px;
      padding: 32px;
    }

    .skeleton-card {
      display: flex;
      gap: 16px;
      padding: 24px;
      background: white;
      border-radius: 12px;
      border: 2px solid #e9ecef;
    }

    .skeleton {
      background: linear-gradient(
        90deg,
        #f1f5f9 25%,
        #e9ecef 50%,
        #f1f5f9 75%
      );
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s ease-in-out infinite;
      border-radius: 8px;
    }

    @keyframes skeleton-loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .skeleton-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .skeleton-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .skeleton-title {
      height: 20px;
      width: 40%;
    }

    .skeleton-text {
      height: 16px;
    }

    @media (max-width: 768px) {
      .skeleton-container {
        padding: 16px;
      }

      .skeleton-card {
        padding: 16px;
      }
    }
  `]
})
export class SkeletonLoaderComponent {
  @Input() count: number = 3;
  @Input() type: 'card' | 'list' | 'table' = 'card';
  
  get items(): number[] {
    return Array(this.count).fill(0);
  }
}
