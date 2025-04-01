import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { TokenService } from './token.service';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const httpInterceptor: HttpInterceptorFn = (request, next) => {
    const authService = inject(AuthService);
    const tokenService = inject(TokenService);
    const router = inject(Router);

    const token = tokenService.getAccessToken();
    if (token) {
        request = request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }

    return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
        if (error.status !== 401) {
            return throwError(() => error);
        }

        if (request.url.includes('/sign-in') || request.url.includes('/sign-out')) {
            return throwError(() => error);
        }

        if (!isRefreshing) {
            isRefreshing = true;
            refreshTokenSubject.next(null);

            return authService.refreshToken().pipe(
          switchMap(response => {
              isRefreshing = false;
              tokenService.setToken(response.token);
              authService.setIsUserAuthenticated(true);
              refreshTokenSubject.next(response.token);

              return next(request.clone({ setHeaders: { Authorization: `Bearer ${response.token}` } }));
          }),
          catchError(err => {
              isRefreshing = false;
              tokenService.clearAccessToken();
              authService.setIsUserAuthenticated(false);
              router.navigate(['sign-in']);
              return throwError(() => err);
          })
        );
        } else {
            return refreshTokenSubject.pipe(
          filter(newToken => newToken != null),
          take(1),
          switchMap(newToken => {
              return next(request.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }));
          })
        );
        }
    })
  );
};
