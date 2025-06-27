import {
    HttpErrorResponse,
    HttpEvent,
    HttpHandlerFn,
    HttpInterceptorFn,
    HttpRequest
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
    BehaviorSubject,
    catchError,
    filter,
    Observable,
    switchMap,
    take,
    throwError
} from 'rxjs';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const httpInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
    const authService = inject(AuthService);
    const tokenService = inject(TokenService);
    const router = inject(Router);

    const token = tokenService.getAccessToken();
    if (token) {
        request = request.clone({
            setHeaders: { Authorization: `Bearer ${token}` },
            withCredentials: true
        });
    }

    function forceLogout(error: any): Observable<never> {
        tokenService.clearAccessToken();
        authService.setIsUserAuthenticated(false);
        refreshTokenSubject.next(null);
        isRefreshing = false;

        try {
            authService.signOut();
        } catch (err) {
            console.error('Erro ao deslogar forçado:', err);
        }

        router.navigate(['/sign-in']);
        return throwError(() => error);
    }

    function enqueueRetry(req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
        return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => {
          const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${token}` },
              withCredentials: true
          });
          return next(retryReq);
      }),
      catchError(err => forceLogout(err)) // <-- se mesmo o retry falhar, desloga
    );
    }

    return next(request).pipe(
    catchError((error: HttpErrorResponse): Observable<HttpEvent<unknown>> => {
        if (
        error.status !== 401 ||
        request.url.includes('/sign-in') ||
        request.url.includes('/sign-out') ||
        request.url.includes('/refresh-token')
      ) {
            return throwError(() => error);
        }

        if (!isRefreshing) {
            isRefreshing = true;
            refreshTokenSubject.next(null);

            return authService.refreshToken().pipe(
          switchMap(response => {
              tokenService.setToken(response.token);
              authService.setIsUserAuthenticated(true);
              refreshTokenSubject.next(response.token);
              isRefreshing = false;

              const retry = request.clone({
                  setHeaders: { Authorization: `Bearer ${response.token}` },
                  withCredentials: true
              });
              return next(retry);
          }),
          catchError(err => forceLogout(err))
        );
        }

        return enqueueRetry(request);
    })
  );
};
