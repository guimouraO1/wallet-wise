import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TokenService } from '../../services/token.service';
import { TranslateModule } from '@ngx-translate/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { LanguageService } from '../../services/language.service';
import { CommonModule } from '@angular/common';
import { User, UserService } from '../../services/user.service';
import { firstValueFrom, Subscription } from 'rxjs';
import { Account, AccountService } from '../../services/account.service';
import { formatMoneyToString } from '../../helpers/format-money';

@Component({
    selector: 'app-navbar',
    imports: [RouterLink, TranslateModule, ReactiveFormsModule, CommonModule, RouterLinkActive],
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

    async ngOnInit() {
        await this.getAccount();
    }

    async getAccount() {
        try {
            const { name, avatarUrl, email, email_already_verified, role, Account } = await firstValueFrom(this.userService.getUser());
            this.user = {
                Account,
                name,
                avatarUrl,
                email,
                email_already_verified,
                role
            };

            this.accountService.setAccount(Account[0]);
        } catch (error) {
            console.error(error);
        }
    }

    toggleSidenav() {
        this.drawerOpen.setValue(false);
    }

    formatMoney(balance: number) {
        return formatMoneyToString(balance);
    }

    async signOut() {
        this.toggleSidenav();
        this.tokenService.clearAccessToken();
        this.authService.setIsUserAuthenticated(false);
        this.router.navigate(['/sign-in']);

        await firstValueFrom(this.authService.signOut()).catch();
    }
}
