import { Component, inject, OnInit } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TokenService } from '../../services/token.service';
import { TranslateModule } from '@ngx-translate/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { LanguageService } from '../../services/language.service';
import { CommonModule } from '@angular/common';
import { User, UserService } from '../../services/user.service';
import { firstValueFrom } from 'rxjs';
import { AccountService } from '../../services/account.service';
import { formatMoneyToString } from '../../helpers/format-money';
import { toast } from 'ngx-sonner';

@Component({
    selector: 'app-navbar',
    imports: [RouterLink, TranslateModule, ReactiveFormsModule, CommonModule, RouterLinkActive],
    templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit {
    protected readonly toast = toast;
    tokenService = inject(TokenService);
    authService = inject(AuthService);
    router = inject(Router);
    languageService = inject(LanguageService);
    themeService = inject(ThemeService);
    userService = inject(UserService);
    accountService = inject(AccountService);

    drawerOpen = new FormControl(false);
    user: User | undefined;
    isLoading = true;

    async ngOnInit() {
        await this.getAccount();
    }

    async getAccount() {
        this.isLoading = true;

        try {
            const { name, avatarUrl, email, email_already_verifyed, role, Account } = await firstValueFrom(this.userService.getUser());
            this.user = {
                Account,
                name,
                avatarUrl,
                email,
                email_already_verifyed,
                role
            };

            this.accountService.setAccount(Account[0]);

            // if (!email_already_verifyed) {
            //     toast.warning('Your email is not verified', {
            //         duration: 10000,
            //         position: 'bottom-center',
            //         action: {
            //             label: 'Verify now',
            //             onClick: async () => await this.verifyEmail()
            //         }
            //     });
            // }
        } catch (error) {
            console.error(error);
        }

        this.isLoading = false;
    }

    async verifyEmail() {
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.info('A verification code has been sent to your email. Please check it to verify your account.');
    }

    toggleSidenav() {
        this.drawerOpen.setValue(false);
    }

    formatMoney(balance: number) {
        return formatMoneyToString(balance);
    }

    get transformNameIntoAvatar(): string {
        if (!this.user?.name) return 'PU';

        const names = this.user.name.split(' ').filter(n => n);
        const initials = names.slice(0, 2).map(name => name[0].toUpperCase()).join('');

        return initials;
    }

    async signOut() {
        this.toggleSidenav();
        this.tokenService.clearAccessToken();
        this.authService.setIsUserAuthenticated(false);
        this.router.navigate(['/sign-in']);

        await firstValueFrom(this.authService.signOut()).catch();
    }
}
