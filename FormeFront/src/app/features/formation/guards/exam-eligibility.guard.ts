import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { FormationService } from '../services/formation.service';

export const examEligibilityGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const formationService = inject(FormationService);

  const formationId = Number(route.paramMap.get('id'));
  if (!formationId) {
    router.navigate(['/formations']);
    return false;
  }

  const userId = auth.getUserId();
  if (!userId) {
    router.navigate(['/login'], { queryParams: { returnUrl: route.url.join('/') } });
    return false;
  }

  return formationService.getFormationProgress(formationId, userId).pipe(
    map(progress => {
      if (!progress.examEligible) {
        router.navigate(['/formations', formationId]);
        return false;
      }
      return true;
    }),
    catchError(() => {
      router.navigate(['/formations', formationId]);
      return of(false);
    })
  );
};
