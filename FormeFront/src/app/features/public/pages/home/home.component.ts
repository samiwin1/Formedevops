import { AfterViewInit, Component, inject } from '@angular/core';
import { ThemeLoaderService } from '../../../../core/services/theme-loader.service'; 

declare const AOS: any;

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html'
})
export class HomeComponent implements AfterViewInit {
  private theme = inject(ThemeLoaderService);

  async ngAfterViewInit(): Promise<void> {
    // 1) Mentor CSS (only on Home)
    this.theme.loadStyle('assets/mentor/vendor/bootstrap/css/bootstrap.min.css');
    this.theme.loadStyle('assets/mentor/vendor/bootstrap-icons/bootstrap-icons.css');
    this.theme.loadStyle('assets/mentor/vendor/aos/aos.css');
    this.theme.loadStyle('assets/mentor/vendor/swiper/swiper-bundle.min.css');
    this.theme.loadStyle('assets/mentor/vendor/glightbox/css/glightbox.min.css');
    this.theme.loadStyle('assets/mentor/css/main.css');

    // 2) Mentor JS (load in order)
    await this.theme.loadScript('assets/mentor/vendor/bootstrap/js/bootstrap.bundle.min.js');
    await this.theme.loadScript('assets/mentor/vendor/aos/aos.js');
    await this.theme.loadScript('assets/mentor/vendor/swiper/swiper-bundle.min.js');
    await this.theme.loadScript('assets/mentor/vendor/glightbox/js/glightbox.min.js');
    await this.theme.loadScript('assets/mentor/js/main.js');

    // 3) Init AOS after script is loaded
    if (typeof AOS !== 'undefined') {
      AOS.init({ once: true, duration: 800 });
      AOS.refresh?.();
    }
  }
}