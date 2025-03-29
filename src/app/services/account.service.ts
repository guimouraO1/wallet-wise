import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { TokenService } from './token.service';

export interface Account {
  id: string;
  balance: number | string;
  created_at?: string;
  updated_at?: string;
  userId?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AccountService {
    private http = inject(HttpClient);
    private tokenService = inject(TokenService);

    private triggerActionSubject = new Subject<void>();

    triggerAction$ = this.triggerActionSubject.asObservable();

    triggerAction() {
        this.triggerActionSubject.next();
    }

    getAccount(): Observable<Account> {
        const userDecoded = this.tokenService.decodeToken();
        const userId = userDecoded?.sub;
        return this.http.get<Account>(`${environment.apiUrl}/account/${userId}`);
    }
}
