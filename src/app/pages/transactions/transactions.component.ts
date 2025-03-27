import { Component, inject, OnInit } from '@angular/core';
import { PayloadTransaction, PaymentMethod, Transaction, TransactionsService, TransactionTypes } from '../../services/transactions.service';
import { firstValueFrom } from 'rxjs';
import { AccountService } from '../../services/account.service';
import { CommonModule } from '@angular/common';
import { formatMoneyToString } from '../../helpers/format-money';
import { formatDate } from '../../helpers/formate-date';
// import { toast, NgxSonnerToaster } from 'ngx-sonner';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
    selector: 'app-transactions',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './transactions.component.html'
})
export class TransactionsComponent implements OnInit {
    // protected readonly toast = toast;
    transactionsService = inject(TransactionsService);
    accountService = inject(AccountService);
    transactions: Transaction[] | undefined;
    transactionsCount: number = 0;
    offset: number = 5;
    page: number = 1;

    selectedPaymentMethod = new FormControl<PaymentMethod | ''>('');
    selectedTransactionType = new FormControl<TransactionTypes | ''>('');
    selectedName = new FormControl('');

    async ngOnInit() {
        await this.getTransactions();
    }

    async removeNameFilter() {
        this.selectedName.reset('');
        this.page = 1;
        await this.getTransactions();
    }

    async onTransactionTypeChange() {
        this.page = 1;
        await this.getTransactions();
    }

    async onPaymentMethodChange() {
        this.page = 1;
        await this.getTransactions();
    }

    async searchByName() {
        this.page = 1;
        await this.getTransactions();
    }

    formatMoneyToString(amount: number){
        return formatMoneyToString(amount);
    }

    formatDate(date: string){
        return formatDate(new Date(date));
    }

    async nextPage() {
        if ((this.page * this.offset) < this.transactionsCount) {
            this.page++;
        }

        await this.getTransactions();
    }

    async previousPage() {
        if (this.page > 1) {
            this.page--;
        }

        await this.getTransactions();
    }

    get startIndex(): number {
        return (this.page - 1) * this.offset + 1;
    }

    get endIndex(): number {
        return Math.min(this.page * this.offset, this.transactionsCount);
    }

    async getTransactions(){
        const account = await firstValueFrom(this.accountService.getAccount());

        const data: PayloadTransaction = {
            accountId: account.id,
            page: this.page,
            offset: this.offset,
            ...(this.selectedTransactionType.value ? { type: this.selectedTransactionType.value } : {}),
            ...(this.selectedPaymentMethod.value ? { paymentMethod: this.selectedPaymentMethod.value } : {}),
            ...(this.selectedName.value ? { name: this.selectedName.value } : {})
        };

        const { transactions, transactionsCount } = await firstValueFrom(this.transactionsService.getTransactions(data));
        this.transactions = transactions;
        this.transactionsCount = transactionsCount;
    }
}
