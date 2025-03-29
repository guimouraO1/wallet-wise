import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export type TransactionTypes = 'withdraw' | 'deposit';
export type PaymentMethod = 'credit_card' | 'debit_card' | 'account_cash' | 'pix';

export interface PayloadTransaction {
  accountId: string;
  page: number;
  offset: number;
  type?: TransactionTypes;
  paymentMethod?: PaymentMethod;
  name?: string;
}

export interface Transaction {
    id: string,
    name: string,
    description: string,
    amount: number,
    date: string,
    type: TransactionTypes,
    paymentMethod: PaymentMethod,
    accountId: string
}

export interface TransactionsResponse {
    transactions: Transaction[],
    transactionsCount: number;
}

export interface PayloadMakeTransaction {
    name: string;
    amount: number;
    type: TransactionTypes;
    paymentMethod: PaymentMethod;
    accountId: string;
    description: string;
}

@Injectable({
    providedIn: 'root'
})
export class TransactionsService {
    private http = inject(HttpClient);

    getTransactions(data: PayloadTransaction): Observable<TransactionsResponse> {
        let params = new HttpParams().set('page', data.page.toString()).set('offset', data.offset.toString());

        if (data.type) {
            params = params.set('type', data.type);
        }

        if (data.name) {
            params = params.set('name', data.name);
        }

        if (data.paymentMethod) {
            params = params.set('paymentMethod', data.paymentMethod);
        }

        return this.http.get<TransactionsResponse>(`${environment.apiUrl}/transaction/${data.accountId}`, { params });
    }

    makeTransaction(data: PayloadMakeTransaction): Observable<any> {
        return this.http.post(`${environment.apiUrl}/transaction`, data);
    }
}
