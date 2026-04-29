import { NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from '../../header/header.component';
import { FooterComponent } from '../../footer/footer.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, NgIf, HeaderComponent, FooterComponent],
  templateUrl: './public-layout.component.html',
})
export class PublicLayoutComponent implements OnInit {
  isFormationRoute = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.updateFormationRoute();
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.updateFormationRoute());
  }

  private updateFormationRoute(): void {
    this.isFormationRoute = this.router.url.startsWith('/formations');
  }

  hideFooterForCurrentRoute(): boolean {
    return (
      this.router.url.startsWith('/me/certification-list') ||
      this.router.url.startsWith('/me/certification-space') ||
      this.router.url.startsWith('/evaluator/oral-assignments')
    );
  }
}
