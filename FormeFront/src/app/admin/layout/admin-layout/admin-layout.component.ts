import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeLoaderService } from '../../../core/services/theme-loader.service';
import { HeaderComponent } from '../../components/header/header.component';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, NavbarComponent, FooterComponent],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css'],
})
export class AdminLayoutComponent implements AfterViewInit {
  public auth = inject(AuthService);
  private router = inject(Router);
  private theme = inject(ThemeLoaderService);

  sidebarCollapsed = false;

  private duraluxStyles = [
    'assets/duralux/vendors/css/vendors.min.css',
    'assets/duralux/vendors/css/daterangepicker.min.css',
    'assets/duralux/vendors/css/dataTables.bs5.min.css',
    'assets/duralux/vendors/css/sweetalert2.min.css',
    'assets/duralux/vendors/css/select2.min.css',
    'assets/duralux/vendors/css/select2-theme.min.css',
    'assets/duralux/vendors/css/animate.min.css',
    'assets/duralux/css/theme.min.css',
  ];

  private duraluxScripts = [
    'assets/duralux/vendors/js/jquery.min.js',
    'assets/duralux/vendors/js/vendors.min.js',
    'assets/duralux/vendors/js/moment.min.js',
    'assets/duralux/vendors/js/daterangepicker.min.js',
    'assets/duralux/vendors/js/apexcharts.min.js',
    'assets/duralux/vendors/js/circle-progress.min.js',
    'assets/duralux/vendors/js/perfect-scrollbar.min.js',
    'assets/duralux/vendors/js/nxlNavigation.min.js',
    'assets/duralux/js/common-init.min.js',
    'assets/duralux/js/dashboard-init.min.js',
  ];

  isFormationRoute(): boolean {
    return this.router.url.includes('/admin/formations');
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  async ngAfterViewInit(): Promise<void> {
    this.duraluxStyles.forEach((href) => this.theme.loadStyle(href));

    for (const src of this.duraluxScripts) {
      await this.theme.loadScript(src);
    }
  }
}
