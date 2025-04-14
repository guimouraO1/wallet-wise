import { Injectable, OnDestroy, OnInit, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TokenService } from './token.service';
import { environment } from '../../environments/environment';
import { firstValueFrom, Observable, Subject, takeUntil } from 'rxjs';

export interface Account {
  id: string;
  balance: number | string;
  created_at?: string;
  updated_at?: string;
  userId?: string;
}

@Injectable({ providedIn: 'root' })
export class AccountService implements OnDestroy {
    private http = inject(HttpClient);
    private tokenService = inject(TokenService);

    private _account = signal<Account | null>(null);
    fetchAccountSubject = new Subject<void>();
    private destroy$ = new Subject<void>();

    constructor() {
        this.fetchAccountSubject.pipe(takeUntil(this.destroy$)).subscribe(() => {
            this.fetchAccount();
        });
    }

    setAccount(account: Account) {
        this._account.set(account);
    }

    get account() {
        return this._account();
    }

    private async fetchAccount() {
        const account = await firstValueFrom(this.getAccount());
        this._account.set(account);
    }

    getAccount(): Observable<Account> {
        const userDecoded = this.tokenService.decodeToken();
        const userId = userDecoded?.sub;
        return this.http.get<Account>(`${environment.apiUrl}/account/${userId}`);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
