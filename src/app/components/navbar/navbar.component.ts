import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { Router, RouterLink } from '@angular/router';
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
    imports: [RouterLink, TranslateModule, ReactiveFormsModule, CommonModule],
    templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit, OnDestroy {
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
    formatedAmount: string = '';
    private actionSubscription: Subscription | null = null;

    async ngOnInit() {
        this.actionSubscription = this.accountService.triggerAction$.subscribe(() => {
            this.getAccount();
        });
        this.getAccount();
    }

    ngOnDestroy() {
        if (this.actionSubscription) {
            this.actionSubscription.unsubscribe();
        }
    }

    async getAccount() {
        try {
            const { name, avatarUrl, email, email_already_verified, role } = await firstValueFrom(this.userService.getUser());
                // Está vindo com senha arrumar backend
            this.user = {
                name,
                avatarUrl,
                email,
                email_already_verified,
                role
            };

            const { balance, id } = await firstValueFrom(this.accountService.getAccount());
            this.formatedAmount = formatMoneyToString(+balance);
            this.account = {
                balance,
                id
            };
        } catch (error) {
            console.error(error);
        }
    }

    toggleSidenav() {
        this.drawerOpen.setValue(false);
    }

    async signOut() {
        this.toggleSidenav();
        this.tokenService.clearAccessToken();
        this.authService.setIsUserAuthenticated(false);
        await firstValueFrom(this.authService.signOut());
        this.router.navigate(['/sign-in']);
    }
}
