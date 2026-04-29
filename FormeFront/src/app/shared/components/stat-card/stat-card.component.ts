import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-stat-card',
  imports: [CommonModule],
  template: `
    <div class="stat-card">
      <div class="stat-top">
        <span class="stat-label">{{ label }}</span>
        <div class="stat-icon-wrap" [ngClass]="'si-' + color">
          <ng-container *ngIf="iconClass; else textIcon">
            <i class="bi" [ngClass]="iconClass"></i>
          </ng-container>
          <ng-template #textIcon>{{ icon }}</ng-template>
        </div>
      </div>
      <div class="stat-val">{{ value }}</div>
      <div class="stat-hint" [ngClass]="hintType" *ngIf="hint">{{ hint }}</div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `],
})
export class StatCardComponent {
  @Input() label = '';
  @Input() value: number | string = 0;
  @Input() icon = 'S';
  @Input() color: 'blue' | 'green' | 'orange' | 'purple' | 'red' = 'blue';
  @Input() iconClass = '';
  @Input() hint = '';
  @Input() hintType: 'up' | 'warn' | 'normal' = 'normal';
}
