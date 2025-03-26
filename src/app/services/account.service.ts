import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

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

    getAccount(userId: string): Observable<Account> {
        return this.http.get<Account>(`${environment.apiUrl}/account/${userId}`);
    }
}
