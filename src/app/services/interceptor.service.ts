import { HttpErrorResponse, HttpInterceptorFn, HttpResponse, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, of, delay } from 'rxjs';
import { TokenService } from './token.service';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

let isRefreshing = false;

export const httpInterceptor: HttpInterceptorFn = (request, next) => {
    const authService = inject(AuthService);
    const tokenService = inject(TokenService);
    const router = inject(Router);

    const token = tokenService.getAccessToken();
    if (token) {
        request = request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }

    return next(request).pipe(
        delay(200),
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                if (!isRefreshing) {
                    isRefreshing = true;
                    return authService.refreshToken().pipe(
                        switchMap((response) => {
                            tokenService.setToken(response.token);
                            authService.setIsUserAuthenticated(true);

                            isRefreshing = false;

                            const newRequest = request.clone({
                                setHeaders: { Authorization: `Bearer ${response.token}` }
                            });

                            return next(newRequest);
                        }),
                        catchError(() => {
                            isRefreshing = false;
                            authService.setIsUserAuthenticated(false);
                            router.navigate(['sign-in']);

                            authService.signOut();
                            return of(new HttpResponse({ status: 401 }));
                        })
                    );
                }
            }

            return throwError(() => error);
        })
    );
};