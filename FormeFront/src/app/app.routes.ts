import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './shared/layouts/public-layout/public-layout.component';
import { AdminLayoutComponent } from './admin/layout/admin-layout/admin-layout.component';
import { adminGuard } from './admin/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { evaluatorGuard } from './core/guards/evaluator.guard';
import { learnerGuard } from './core/guards/learner.guard';
import { superAdminGuard } from './core/guards/super-admin.guard';
import { formationRoutes, adminFormationRoutes } from './features/formation/formation.routes';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', loadComponent: () => import('./features/public/pages/home/home.component').then(m => m.HomeComponent) },
      { path: 'login', loadComponent: () => import('./features/auth/pages/login/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./features/auth/pages/register/register.component').then(m => m.RegisterComponent) },
      { path: 'profile', loadComponent: () => import('./features/auth/pages/profile/profile.component').then(m => m.ProfileComponent), canActivate: [authGuard] },
      { path: 'formations', children: formationRoutes },
      { path: 'articles', loadComponent: () => import('./features/articles/pages/article-page/article-page.component').then(m => m.ArticlePageComponent) },
      { path: 'me/certification-list', redirectTo: 'me/certification-space', pathMatch: 'full' },
      {
        path: 'evaluator/oral-assignments',
        loadComponent: () => import('./features/certification/evaluator/certification-evaluator.component').then(m => m.CertificationEvaluatorComponent),
        canActivate: [evaluatorGuard],
      },
      {
        path: 'me/certification-space',
        loadComponent: () => import('./features/certification/learner/certification-learner.component').then(m => m.CertificationLearnerComponent),
        canActivate: [learnerGuard],
      },
      { path: 'courses', loadComponent: () => import('./features/shop/pages/courses-list/courses-list.component').then(m => m.CoursesListComponent) },
      { path: 'cart', loadComponent: () => import('./features/shop/pages/cart/cart.component').then(m => m.CartComponent), canActivate: [authGuard] },
      { path: 'checkout', loadComponent: () => import('./features/shop/pages/checkout/checkout.component').then(m => m.CheckoutComponent), canActivate: [authGuard] },
      { path: 'order/confirmation/:orderId', loadComponent: () => import('./features/shop/pages/order-confirmation/order-confirmation.component').then(m => m.OrderConfirmationComponent), canActivate: [authGuard] },
      { path: 'announcements', loadComponent: () => import('./features/public/pages/announcements/announcements-page.component').then(m => m.AnnouncementsPageComponent), canActivate: [authGuard] },
    ],
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'formations', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./admin/pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'formations', children: adminFormationRoutes },
      { path: 'users', loadComponent: () => import('./admin/pages/user-management/user-management.component').then(m => m.UserManagementComponent) },
      { path: 'certifications', loadComponent: () => import('./features/certification/admin/certification-admin.component').then(m => m.CertificationAdminComponent), data: { mode: 'certification' } },
      { path: 'oral-sessions', loadComponent: () => import('./features/certification/admin/certification-admin.component').then(m => m.CertificationAdminComponent), data: { mode: 'oral' } },
      { path: 'oral-sessions/calendar', loadComponent: () => import('./admin/pages/sessions-calendar/sessions-calendar.component').then(m => m.SessionsCalendarComponent) },
      { path: 'reschedule', loadComponent: () => import('./admin/pages/reschedule-admin/reschedule-admin.component').then(m => m.RescheduleAdminComponent) },
      { path: 'issued-certificates', loadComponent: () => import('./admin/pages/issued-certificates-admin/issued-certificates-admin.component').then(m => m.IssuedCertificatesAdminComponent) },
      { path: 'sessions-calendar', loadComponent: () => import('./admin/pages/sessions-calendar/sessions-calendar.component').then(m => m.SessionsCalendarComponent) },
      { path: 'products/create', loadComponent: () => import('./features/shop/pages/admin/product-create/product-create.component').then(m => m.ProductCreateComponent) },
      { path: 'products/edit/:id', loadComponent: () => import('./features/shop/pages/admin/product-edit/product-edit.component').then(m => m.ProductEditComponent) },
      { path: 'products/list', loadComponent: () => import('./features/shop/pages/admin/product-list/product-list.component').then(m => m.ProductListComponent) },
      { path: 'documents/add', loadComponent: () => import('./features/documents/pages/admin/document-add/document-add.component').then(m => m.DocumentAddComponent) },
      { path: 'documents/edit/:id', loadComponent: () => import('./features/documents/pages/admin/document-edit/document-edit.component').then(m => m.DocumentEditComponent) },
      { path: 'documents/list', loadComponent: () => import('./features/documents/pages/admin/document-list/document-list.component').then(m => m.DocumentListComponent) },
      { path: 'orders', loadComponent: () => import('./features/shop/pages/admin/order-list/order-list.component').then(m => m.OrderListComponent) },
      { path: 'partners', loadComponent: () => import('./admin/pages/partners/partners.component').then(m => m.PartnersComponent) },
      { path: 'deals', loadComponent: () => import('./admin/pages/deals/deals.component').then(m => m.DealsComponent) },
      { path: 'packs', loadComponent: () => import('./admin/pages/packs/packs.component').then(m => m.PacksComponent) },
      { path: 'access-codes', loadComponent: () => import('./admin/pages/access-codes/access-codes.component').then(m => m.AccessCodesComponent) },
    ],
  },
  {
    path: 'admins',
    loadComponent: () => import('./admin/pages/admin-management/admin-management.component').then(m => m.AdminManagementComponent),
    canActivate: [adminGuard, superAdminGuard],
  },
  { path: '**', redirectTo: '' },
];
