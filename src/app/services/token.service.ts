import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class TokenService {
    getAccessToken(): string | null {
        return localStorage.getItem('AccessToken');
    }

    clearAccessToken() {
        localStorage.removeItem('AccessToken');
    }

    setToken(token: string) {
        localStorage.setItem('AccessToken', token);
    }
}
