import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

const RETRY_AFTER_REFRESH = new HttpContextToken<boolean>(() => true);

function isAuthEndpoint(url: string): boolean {
  return url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const accessToken = authService.getAccessToken();

  const requestWithAuth =
    accessToken && !isAuthEndpoint(req.url)
      ? req.clone({
          setHeaders: { Authorization: `Bearer ${accessToken}` },
        })
      : req;

  return next(requestWithAuth).pipe(
    catchError((error: unknown) => {
      const shouldTryRefresh =
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !isAuthEndpoint(req.url) &&
        req.context.get(RETRY_AFTER_REFRESH);

      if (!shouldTryRefresh) {
        return throwError(() => error);
      }

      return authService.refreshAccessToken().pipe(
        switchMap((newToken) => {
          const retriedRequest = req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` },
            context: req.context.set(RETRY_AFTER_REFRESH, false),
          });
          return next(retriedRequest);
        }),
        catchError((refreshError: unknown) => {
          authService.clearSessionAndRedirect();
          return throwError(() => refreshError);
        })
      );
    })
  );
};
