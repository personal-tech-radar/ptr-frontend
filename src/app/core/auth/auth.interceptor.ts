import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { APP_CONFIG } from '../config/app-config';
import { AuthSessionService } from './auth-session.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(AuthSessionService);
  const token = session.token();
  const apiRequest = request.url.startsWith(APP_CONFIG.apiUrl);
  const authRequest = request.url.includes('/auth/');
  const authenticatedRequest = apiRequest && token && !authRequest;
  const outgoing = authenticatedRequest
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(outgoing).pipe(
    catchError((error: unknown) => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        authRequest ||
        !apiRequest
      ) {
        return throwError(() => error);
      }
      return session.refresh().pipe(
        switchMap((newToken) => {
          if (!newToken) return throwError(() => error);
          return next(request.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }));
        }),
        catchError((refreshError: unknown) => {
          session.clear();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
