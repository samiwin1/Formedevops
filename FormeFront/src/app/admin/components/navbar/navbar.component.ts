import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  pendingRescheduleCount = 0;

  ngOnInit(): void {
    this.dashboardService.getAdminStats().subscribe({
      next: (stats) => { this.pendingRescheduleCount = stats.pendingReschedules ?? 0; },
      error: () => {}
    });
  }
}