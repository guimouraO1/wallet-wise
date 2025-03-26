import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

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

    decodeToken() {
        const token = this.getAccessToken();
        if (!token) return null;
        return jwtDecode(token);
    }
}
