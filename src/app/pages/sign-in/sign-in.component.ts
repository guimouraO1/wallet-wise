import { Component, inject, OnInit } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import {FormGroup, FormControl, Validators, ReactiveFormsModule} from '@angular/forms';
import { AuthService, SignInForm } from '../../services/auth.service';
import { firstValueFrom } from 'rxjs';
import { TokenService } from '../../services/token.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sign-in',
  imports: [ReactiveFormsModule],
  templateUrl: './sign-in.component.html'
})
export class SignInComponent implements OnInit {
    themeService: ThemeService = inject(ThemeService);
    authService: AuthService = inject(AuthService);
    tokenService: TokenService = inject(TokenService);
    router = inject(Router);

    isPasswordVisible: boolean = false;

    signInForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*]).{8,}$')])
    });

    ngOnInit(): void {
      this.redirectIfAuthenticated();
    }

    redirectIfAuthenticated() {
      const isUserAuthenticated = this.authService.getIsUserAuthenticated();
      if (!isUserAuthenticated) return;

      this.router.navigate(['home']);
    }

    togglePasswordVisibility() {
      this.isPasswordVisible = !this.isPasswordVisible;
    }

    async signIn() {
      if (this.signInForm.invalid) return;
      const signInData = this.signInForm.value as SignInForm;

      try {
        const response = await firstValueFrom(this.authService.signIn(signInData));
        this.tokenService.setToken(response.token);
        this.authService.setIsUserAuthenticated(true);

        this.router.navigate(['home']);
      } catch (error) {
        console.error(error);
      }
    }
}
