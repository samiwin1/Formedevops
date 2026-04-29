import { AsyncPipe, NgIf } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../features/shop/services/cart.service';
import { NotificationBellComponent } from '../components/notification-bell/notification-bell.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf, AsyncPipe, NotificationBellComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  private auth = inject(AuthService);
  cartService = inject(CartService);

  isLoggedIn$ = this.auth.isLoggedIn$;
  cartCount$ = this.cartService.cartCount$;

  mobileOpen = false;
  menuOpen = false;

  isAdminOrSuperAdmin(): boolean {
    return this.auth.isAdmin() || this.auth.isSuperAdmin();
  }

  logout() {
    this.auth.logout();
  }

  isAdmin(): boolean {
    return this.auth.isAdmin();
  }

  isEvaluator(): boolean {
    return this.auth.isEvaluator();
  }

  isLearner(): boolean {
    return this.auth.isLearner();
  }

  isUser(): boolean {
    return this.auth.isUser();
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  closeAll() {
    this.mobileOpen = false;
    this.menuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.fm-dropdown')) this.menuOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    this.closeAll();
  }
}
