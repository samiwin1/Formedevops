import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Toast, ToastService } from '../../../core/services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" role="alert" aria-live="polite">
      <div *ngFor="let toast of toasts" 
           class="toast animate-slideInRight"
         [ngClass]="'toast-' + toast.type">
        <div class="toast-icon">
          <i class="bi" [ngClass]="{
            'bi-check-circle-fill text-success': toast.type === 'success',
            'bi-exclamation-circle-fill text-danger': toast.type === 'error',
            'bi-exclamation-triangle-fill text-warning': toast.type === 'warning',
            'bi-info-circle-fill text-info': toast.type === 'info'
          }"></i>
        </div>
        <div class="toast-content">
          <p class="toast-message">{{ toast.message }}</p>
        </div>
        <button class="toast-close" (click)="removeToast(toast.id)" aria-label="Close">
          <i class="bi bi-x"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 100px;
      right: 32px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 400px;
      pointer-events: none;
    }

    .toast {
      background: white;
      border-radius: 12px;
      padding: 16px 20px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: flex-start;
      gap: 12px;
      animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border-left: 4px solid #cbd5e1;
      pointer-events: auto;
      min-width: 300px;
    }

    .toast-success {
      border-left-color: #10b981;
    }

    .toast-error {
      border-left-color: #ef4444;
    }

    .toast-warning {
      border-left-color: #f59e0b;
    }

    .toast-info {
      border-left-color: #3b82f6;
    }

    .toast-icon {
      flex-shrink: 0;
      font-size: 20px;
      margin-top: 2px;
    }

    .toast-content {
      flex: 1;
    }

    .toast-message {
      margin: 0;
      font-size: 14px;
      color: #2c3e50;
      line-height: 1.5;
    }

    .toast-close {
      flex-shrink: 0;
      background: transparent;
      border: none;
      color: #6c757d;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .toast-close:hover {
      background: #f1f5f9;
      color: #2c3e50;
    }

    .toast-close i {
      font-size: 18px;
    }

    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @media (max-width: 640px) {
      .toast-container {
        right: 16px;
        left: 16px;
        max-width: none;
      }

      .toast {
        min-width: auto;
      }
    }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private subscription?: Subscription;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.subscription = this.toastService.toasts$.subscribe(toast => {
      this.toasts.push(toast);
      
      if (toast.duration) {
        setTimeout(() => {
          this.removeToast(toast.id);
        }, toast.duration);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  removeToast(id: string): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }
}
