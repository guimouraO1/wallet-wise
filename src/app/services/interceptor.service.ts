import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, of, switchMap, take, throwError } from 'rxjs';
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
            if (error.status === 401) {
                if (request.url.includes('/sign-in') || request.url.includes('/sign-out')) {
                    return throwError(() => error);
                }

                if (!isRefreshing) {
                    isRefreshing = true;
                    refreshTokenSubject.next(null);

                    return authService.refreshToken().pipe(
                        switchMap((response) => {
                            tokenService.setToken(response.token);
                            authService.setIsUserAuthenticated(true);
                            isRefreshing = false;
                            refreshTokenSubject.next(response.token);

                            const newRequest = request.clone({
                                setHeaders: { Authorization: `Bearer ${response.token}` }
                            });

                            return next(newRequest);
                        }),
                        catchError(() => {
                            isRefreshing = false;
                            authService.setIsUserAuthenticated(false);
                            router.navigate(['sign-in']);
                            return authService.signOut().pipe(switchMap(() => of(new HttpResponse({ status: 401 }))));
                        })
                    );
                } else {
                    return refreshTokenSubject.pipe(
                        filter(token => token !== null),
                        take(1),
                        switchMap((newToken) => {
                            const newRequest = request.clone({
                                setHeaders: { Authorization: `Bearer ${newToken}` }
                            });
                            return next(newRequest);
                        })
                    );
                }
            }

            return throwError(() => error);
        })
    );
};
