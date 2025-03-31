import { Component, inject, OnInit } from '@angular/core';
import { PayloadTransaction, PaymentMethod, Transaction, TransactionsService, TransactionTypes } from '../../services/transactions.service';
import { firstValueFrom, take } from 'rxjs';
import { AccountService } from '../../services/account.service';
import { CommonModule } from '@angular/common';
import { formatMoneyToString } from '../../helpers/format-money';
import { formatDate } from '../../helpers/formate-date';
import { toast, NgxSonnerToaster } from 'ngx-sonner';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { MakeTransactinoModalComponent } from '../../components/make-transactino-modal/make-transactino-modal.component';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-transactions',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, NgxSonnerToaster, DialogModule, TranslateModule],
    templateUrl: './transactions.component.html'
})
export class TransactionsComponent implements OnInit {
    protected readonly toast = toast;
    transactionsService = inject(TransactionsService);
    accountService = inject(AccountService);
    dialog = inject(Dialog);
    languageService = inject(LanguageService);
    router = inject(Router);
    route = inject(ActivatedRoute);

    transactions: Transaction[] = [];
    transactionsCount: number = 0;
    offset: number = 5;
    page: number = 1;

    selectedPaymentMethod = new FormControl<PaymentMethod | ''>('');
    selectedTransactionType = new FormControl<TransactionTypes | ''>('');
    selectedName = new FormControl('');

    selectedTransactions: Transaction[] = [];

    isLoading = true;
    isError = false;

    async ngOnInit() {
        this.route.queryParams.subscribe(params => {
            this.selectedTransactionType.setValue(params['type'] || '');
            this.selectedPaymentMethod.setValue(params['paymentMethod'] || '');
            this.selectedName.setValue(params['name'] || '');
            this.page = params['page'] ? Number(params['page']) : 1;
            this.getTransactions();
        });
    }

    toggleAllSelection(event: Event) {
        const isChecked = (event.target as HTMLInputElement).checked;
        this.selectedTransactions = isChecked ? [...this.transactions] : [];
    }

    async resetFilters() {
        this.router.navigate([], { queryParams: {} });
    }

    toggleSelection(transaction: Transaction, event: Event) {
        const isChecked = (event.target as HTMLInputElement).checked;
        this.selectedTransactions = isChecked
            ? [...this.selectedTransactions, transaction]
            : this.selectedTransactions.filter(t => t !== transaction);
    }

    addFilterParam(filter: any) {
        this.router.navigate([], { queryParams: filter, queryParamsHandling: 'merge' });
    }

    async onTransactionTypeChange() {
        this.page = 1;
        this.addFilterParam({ type: this.selectedTransactionType.value });
    }

    async removeNameFilter() {
        this.selectedName.reset('');
        this.page = 1;
        this.addFilterParam({ name: null });
    }

    async onPaymentMethodChange() {
        this.page = 1;
        this.addFilterParam({ paymentMethod: this.selectedPaymentMethod.value });
    }

    async searchByName() {
        this.page = 1;
        this.addFilterParam({ name: this.selectedName.value });
    }

    formatMoneyToString(amount: number) {
        return formatMoneyToString(amount);
    }

    formatDate(date: string) {
        return formatDate(new Date(date), this.languageService);
    }

    async nextPage() {
        if ((this.page * this.offset) < this.transactionsCount) {
            this.page++;
            this.addFilterParam({ page: this.page });
        }
    }

    async previousPage() {
        if (this.page > 1) {
            this.page--;
            this.addFilterParam({ page: this.page });
        }
    }

    get startIndex(): number {
        return (this.page - 1) * this.offset + 1;
    }

    get endIndex(): number {
        return Math.min(this.page * this.offset, this.transactionsCount);
    }

    async makeTransaction() {
        this.openDialog();
    }

    openDialog(): void {
        const dialogRef = this.dialog.open(MakeTransactinoModalComponent);
        dialogRef.closed.pipe(take(1)).subscribe(async (result) => {
            if (!result) return;
            this.page = 1;
            this.getTransactions();
        });
    }

    deleteTransactions() {
        toast.error('No delete function at all');
        this.selectedTransactions = [];
    }

    async getTransactions() {
        this.isLoading = true;
        this.isError = false;

        try {
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
        } catch (error) {
            this.transactions = [];
            this.isError = true;
            toast.error('Error getting transactions');
        }
        this.isLoading = false;
    }
}
