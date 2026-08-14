import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthSessionService } from './auth-session.service';

export const authGuard: CanActivateFn = (_route, state) => {
  if (isPlatformServer(inject(PLATFORM_ID))) return true;
  const session = inject(AuthSessionService);
  const router = inject(Router);
  return session.restore().pipe(
    map((user) =>
      user
        ? true
        : router.createUrlTree(['/login'], {
            queryParams: { returnUrl: safeReturnUrl(state.url) },
          }),
    ),
    catchError(() =>
      of(
        router.createUrlTree(['/login'], { queryParams: { returnUrl: safeReturnUrl(state.url) } }),
      ),
    ),
  );
};

export function safeReturnUrl(value: string | null): string {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/radar';
}
