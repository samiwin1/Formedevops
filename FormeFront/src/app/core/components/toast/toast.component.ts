import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Inject, InjectionToken, Output } from '@angular/core';

export interface ToastDataModel {
  message: string;
  type: string;
}

export const TOAST_DATA = new InjectionToken<ToastDataModel>('TOAST_DATA');

@Component({
  standalone: true,
  selector: 'app-toast',
  imports: [CommonModule],
  template: `
    <div class="toast-box" [class]="'toast-' + (data?.type ?? 'success')" (click)="closed.emit()">
      <span class="toast-message">{{ data?.message ?? '' }}</span>
      <button type="button" class="toast-close btn-close btn-close-white btn-sm" aria-label="Close" (click)="closed.emit(); $event.stopPropagation()"></button>
    </div>
  `,
  styles: [`
    .toast-box {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      min-width: 280px;
      max-width: 420px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      color: #fff;
    }
    .toast-success { background: #198754; }
    .toast-info { background: #0d6efd; }
    .toast-warning { background: #ffc107; color: #212529; }
    .toast-error { background: #dc3545; }
    .toast-message { flex: 1; }
    .toast-close { flex-shrink: 0; opacity: 0.8; }
  `],
})
export class ToastComponent {
  @Output() closed = new EventEmitter<void>();

  constructor(@Inject(TOAST_DATA) public data: ToastDataModel | null) {}
}
