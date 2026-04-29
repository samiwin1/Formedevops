import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { examEligibilityGuard } from './guards/exam-eligibility.guard';

export const formationRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/formation-list/formation-list.component').then(
        m => m.FormationListComponent
      )
  },
  {
    path: ':id/history',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/formation-history/formation-history.component').then(
        m => m.FormationHistoryComponent
      )
  },
  {
    path: ':id/exam',
    canActivate: [authGuard, examEligibilityGuard],
    loadComponent: () =>
      import('./pages/exam/exam.component').then(m => m.ExamComponent)
  },
  {
    path: ':id/result',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/exam-result/exam-result.component').then(
        m => m.ExamResultComponent
      )
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/formation-detail/formation-detail.component').then(
        m => m.FormationDetailComponent
      )
  }
];

export const adminFormationRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/admin/admin-formation-list/admin-formation-list.component').then(
        m => m.AdminFormationListComponent
      )
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('./pages/admin/formation-analytics/formation-analytics.component').then(
        m => m.FormationAnalyticsComponent
      )
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./pages/admin/formation-create/formation-create.component').then(
        m => m.FormationCreateComponent
      )
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./pages/admin/formation-edit/formation-edit.component').then(
        m => m.FormationEditComponent
      )
  },
  {
    path: ':id/content',
    loadComponent: () =>
      import('./pages/admin/formation-content/formation-content.component').then(
        m => m.FormationContentComponent
      )
  },
  {
    path: ':id/evaluations',
    loadComponent: () =>
      import('./pages/admin/formation-evaluations/formation-evaluations.component').then(
        m => m.FormationEvaluationsComponent
      )
  },
  {
    path: ':id/exam',
    loadComponent: () =>
      import('./pages/admin/formation-exam/formation-exam.component').then(
        m => m.FormationExamComponent
      )
  }
];
