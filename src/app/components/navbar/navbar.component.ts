import { Component, inject } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TokenService } from '../../services/token.service';
import { TranslateModule } from '@ngx-translate/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { LanguageService } from '../../services/language.service';

@Component({
    selector: 'app-navbar',
    imports: [RouterLink, TranslateModule, ReactiveFormsModule],
    templateUrl: './navbar.component.html'
})
export class NavbarComponent {
    drawerOpen = new FormControl(false);
    tokenService = inject(TokenService);
    authService = inject(AuthService);
    router = inject(Router);
    languageService = inject(LanguageService);
    themeService = inject(ThemeService);

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
