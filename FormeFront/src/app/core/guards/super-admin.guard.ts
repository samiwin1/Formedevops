import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const superAdminGuard: CanActivateFn = () => {
  const router = inject(Router);
  // Use the same storage key as AuthService
  const token = localStorage.getItem('forme_token');

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      router.navigate(['/login']);
      return false;
    }

    // Decode base64url payload (same approach as AuthService)
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(json);
    const roles: string[] = payload.roles ?? [];

    if (roles.includes('ROLE_SUPER_ADMIN')) {
      return true;
    }

    // Logged in but not super admin → redirect to dashboard
    router.navigate(['/admin/dashboard']);
    return false;

  } catch {
    router.navigate(['/login']);
    return false;
  }
};