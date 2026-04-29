import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AnnouncementsDisplayComponent } from '../../../../shared/components/announcements-display/announcements-display.component';

@Component({
  selector: 'app-announcements-page',
  standalone: true,
  imports: [CommonModule, RouterModule, AnnouncementsDisplayComponent],
  templateUrl: './announcements-page.component.html',
  styleUrl: './announcements-page.component.css'
})
export class AnnouncementsPageComponent {
}
