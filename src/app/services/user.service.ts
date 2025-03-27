import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TokenService } from './token.service';

export interface User {
  name: string;
  id?: string;
  email: string;
  role: 'standard' | 'admin';
  created_at?: string;
  updated_at?: string;
  avatarUrl: string;
  email_already_verified: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private http = inject(HttpClient);
    private tokenService = inject(TokenService);

    getUser(): Observable<User> {
        const userDecoded = this.tokenService.decodeToken();
        const userId = userDecoded?.sub;
        return this.http.get<User>(`${environment.apiUrl}/user/${userId}`);
    }
}
