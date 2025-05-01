import { Component, inject, OnInit } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService, SignInForm } from '../../services/auth.service';
import { firstValueFrom } from 'rxjs';
import { TokenService } from '../../services/token.service';
import { Router } from '@angular/router';
import { toast } from 'ngx-sonner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BadRequestError } from '../../interfaces/bad-request-error.interface';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
    selector: 'app-sign-in',
    imports: [ReactiveFormsModule, TranslateModule],
    templateUrl: './sign-in.component.html'
})
export class SignInComponent implements OnInit {
    protected themeService: ThemeService = inject(ThemeService);
    private  authService: AuthService = inject(AuthService);
    private tokenService: TokenService = inject(TokenService);
    private router = inject(Router);
    protected translateService = inject(TranslateService);

    protected isLoading = false;
    protected readonly toast = toast;
    protected isPasswordVisible: boolean = false;

    protected signInForm = new FormGroup({
        email: new FormControl('', [Validators.required, Validators.email, Validators.max(200)]),
        password: new FormControl('', [Validators.required, Validators.min(6), Validators.max(200)])
    });

    ngOnInit(): void {
        this.redirectIfAuthenticated();
    }

    protected redirectIfAuthenticated(): void {
        const isUserAuthenticated = this.authService.getIsUserAuthenticated();
        if (!isUserAuthenticated) return;

        this.router.navigate(['home']);
    }

    protected togglePasswordVisibility(): void {
        this.isPasswordVisible = !this.isPasswordVisible;
    }

    protected async signIn(): Promise<void> {
        this.isLoading = true;
        const signInData = this.signInForm.value as SignInForm;

        try {
            const response = await firstValueFrom(this.authService.signIn(signInData));
            this.tokenService.setToken(response.token);
            this.authService.setIsUserAuthenticated(true);

            this.router.navigate(['home']);
        } catch (response: any) {
            if (response instanceof HttpErrorResponse) {
                if (response.status === 400) {
                    const errorsZod = response.error as BadRequestError;
                    // toast.error(errorsZod.message);

                    errorsZod.errors.forEach((error) => {
                        if (error.path  === 'email') {
                            const msg = this.translateService.instant('errors.signIn.email');
                            toast.error(msg, { duration: 5000 });
                        } else if (error.path === 'password') {
                            const msg = this.translateService.instant('errors.signIn.password');
                            toast.error(msg, { duration: 5000 });
                        } else {
                            toast.error(`${error.path} - ${error.message}`, { duration: 5000 });
                        }
                    });
                } else if (response.status === 401) {
                    const msg = this.translateService.instant('errors.unauthorized');
                    toast.error(msg);
                } else {
                    toast.error(response.message);
                }
            }
        }

        this.isLoading = false;
    }
}
