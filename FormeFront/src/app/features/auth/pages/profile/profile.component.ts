import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { AnnouncementsDisplayComponent } from '../../../../shared/components/announcements-display/announcements-display.component';

@Component({
  standalone: true,
  selector: 'app-profile',
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent {
  private auth = inject(AuthService);
  announcementsDisplayComponent = AnnouncementsDisplayComponent;

  payload = this.auth.getPayload(); // we’ll add getPayload() if missing
  email = this.auth.getEmail();
  uid = this.auth.getUserId();
  roles = this.auth.getRoles();

  logout() {
    this.auth.logout();
  }
  copied = false;

copyEmail() {
  if (!this.email) return;

  navigator.clipboard.writeText(this.email).then(() => {
    this.copied = true;
    setTimeout(() => (this.copied = false), 1600);
  });
}
}