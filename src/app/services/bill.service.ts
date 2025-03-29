import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export type BillCreateInput = {
    name: string
    description?: string | null;
    amount: number;
    dueDate: Date;
    isPaid?: boolean;
    installmentDay: number;
    installments: number;
    paidInstallments?: number;
    accountId: string;
}

export type Bill = {
    name: string;
    id: string;
    description: string | null;
    amount: number;
    dueDate: Date;
    isPaid: boolean;
    accountId: string;
    installments: number;
    installmentDay: number;
    paidInstallments: number;
    createdAt: Date;
    updatedAt: Date;
}

export type FindManyBillsInput = {
    name?: string;
    isPaid?: boolean;
    accountId: string;
    page: number;
    offset: number;
}

export type FindManyBillsResponse = {
    billsCount: number;
    bills: Bill[]
}

@Injectable({
    providedIn: 'root'
})
export class BillService {
    private http = inject(HttpClient);

    getBills(data: FindManyBillsInput): Observable<FindManyBillsResponse> {
        let params = new HttpParams().set('page', data.page.toString()).set('offset', data.offset.toString());

        if (data.name) {
            params = params.set('name', data.name);
        }

        if (data.isPaid !== undefined) {
            params = params.set('isPaid', data.isPaid);
        }

        return this.http.get<FindManyBillsResponse>(`${environment.apiUrl}/bill/${data.accountId}`, { params });
    }

    makeBill(data: BillCreateInput) {
        return this.http.post(`${environment.apiUrl}/bill`, data);
    }
}
