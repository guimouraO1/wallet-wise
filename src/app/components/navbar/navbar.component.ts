import { Component, inject, OnInit } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TokenService } from '../../services/token.service';
import { TranslateModule } from '@ngx-translate/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { LanguageService } from '../../services/language.service';
import { CommonModule } from '@angular/common';
import { User, UserService } from '../../services/user.service';
import { firstValueFrom } from 'rxjs';
import { Account, AccountService } from '../../services/account.service';

@Component({
    selector: 'app-navbar',
    imports: [RouterLink, TranslateModule, ReactiveFormsModule, CommonModule],
    templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit {
    drawerOpen = new FormControl(false);
    tokenService = inject(TokenService);
    authService = inject(AuthService);
    router = inject(Router);
    languageService = inject(LanguageService);
    themeService = inject(ThemeService);
    userService = inject(UserService);
    accountService = inject(AccountService);
    user: User | undefined;
    account: Account | undefined;

    async ngOnInit() {
        try {
            const userDecoded = this.tokenService.decodeToken();
            if (!userDecoded || !userDecoded.sub) return;
            const { name, avatarUrl, email, email_already_verified, role } = await firstValueFrom(this.userService.getUser(userDecoded.sub));
                // Está vindo com senha arrumar backend

            this.user = {
                name,
                avatarUrl,
                email,
                email_already_verified,
                role
            };

            const { balance, id } = await firstValueFrom(this.accountService.getAccount(userDecoded.sub));
            const amount = this.transformAmountToString(+balance);

            this.account = {
                balance: amount,
                id
            };
        } catch (error) {
            console.error(error);
        }
    }

    transformAmountToString(balance: number) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(balance));
    }

    toggleSidenav() {
        this.drawerOpen.setValue(false);
    }

    signOut() {
        this.toggleSidenav();
        this.tokenService.clearAccessToken();
        this.authService.setIsUserAuthenticated(false);
        this.authService.signOut();
        this.router.navigate(['/sign-in']);
    }
}
