import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

type BillType = 'recurring' | 'installment';
type BillFrequency = 'monthly' | 'weekly' | 'annual';

export type BillCreateInput = {
    name: string;
    description?: string | null;
    amount: number;
    billType: BillType;
    dueDay: number | null;
    frequency: BillFrequency;
    installments?: number;
    paidInstallments: number;
    active: boolean;
    accountId: string;
};

export type Bill = {
    name: string;
    id: string;
    description: string | null;
    amount: number;
    billType: BillType;
    dueDay?: number | null;
    frequency?: BillFrequency | null;
    active: boolean;
    accountId: string;
    installments: number | null;
    paidInstallments: number | null;
    createdAt: Date;
    updatedAt: Date;
}

export type FindManyBillsInput = {
    name?: string;
    active?: boolean;
    billType?: BillType;
    frequency?: BillFrequency;
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

        if (data.active) {
            params = params.set('active', data.active);
        }

        if (data.billType) {
            params = params.set('billType', data.billType);
        }

        if (data.frequency) {
            params = params.set('frequency', data.frequency);
        }

        return this.http.get<FindManyBillsResponse>(`${environment.apiUrl}/bill/${data.accountId}`, { params });
    }

    getBillsInPeriod(accountId: string, startDate: string, endDate: string): Observable<FindManyBillsResponse> {
        const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
        return this.http.get<FindManyBillsResponse>(`${environment.apiUrl}/bill/period/${accountId}`, { params });
    }

    makeBill(data: BillCreateInput) {
        return this.http.post(`${environment.apiUrl}/bill`, data);
    }

    payInvoice(billId: string, accountId: string) {
        return this.http.post(`${environment.apiUrl}/invoice/bill`, { billId, accountId });
    }

    deleteBill(id: string, accountId: string): Observable<object> {
        return this.http.delete<object>(`${environment.apiUrl}/bill/${accountId}/${id}`);
    }
}
