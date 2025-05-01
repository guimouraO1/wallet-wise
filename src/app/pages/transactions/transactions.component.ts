import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { PayloadTransaction, PaymentMethod, Transaction, TransactionsService, TransactionTypes } from '../../services/transactions.service';
import { firstValueFrom, Subject, take, takeUntil } from 'rxjs';
import { AccountService } from '../../services/account.service';
import { CommonModule } from '@angular/common';
import { formatMoneyToString } from '../../helpers/format-money';
import { formatDate } from '../../helpers/formate-date';
import { toast } from 'ngx-sonner';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';
import { Router, ActivatedRoute } from '@angular/router';
import { MakeTransactionsModalComponent } from '../../components/make-transactions-modal/make-transactions-modal.component';
import { DeleteTransactionsModalComponent } from '../../components/delete-transactions-modal/delete-transactions-modal.component';
import { HttpErrorResponse } from '@angular/common/http';
import { BadRequestError } from '../../interfaces/bad-request-error.interface';

@Component({
    selector: 'app-transactions',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, DialogModule, TranslateModule],
    templateUrl: './transactions.component.html'
})
export class TransactionsComponent implements OnInit, OnDestroy {
    protected transactionsService = inject(TransactionsService);
    protected accountService = inject(AccountService);
    protected dialog = inject(Dialog);
    protected languageService = inject(LanguageService);
    protected router = inject(Router);
    protected route = inject(ActivatedRoute);
    protected translateService = inject(TranslateService);

    protected readonly toast = toast;

    protected transactions: Transaction[] = [];
    protected transactionsCount: number = 0;

    protected offset: number = 5;
    protected page: number = 1;

    protected selectedPaymentMethod = new FormControl<PaymentMethod | ''>('');
    protected selectedTransactionType = new FormControl<TransactionTypes | ''>('');
    protected selectedName = new FormControl<string>('');

    protected selectedTransactions: Transaction[] = [];

    protected isLoading = true;
    protected isError = false;

    private destroy$ = new Subject<void>();

    async ngOnInit() {
        this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
            this.selectedTransactionType.setValue(params['type'] || '');
            this.selectedPaymentMethod.setValue(params['paymentMethod'] || '');
            this.selectedName.setValue(params['name'] || '');
            this.page = params['page'] ? Number(params['page']) : 1;
        });

        await this.getTransactions();
    }

    protected toggleAllSelection(event: Event) {
        const isChecked = (event.target as HTMLInputElement).checked;
        this.selectedTransactions = isChecked ? [...this.transactions] : [];
    }

    protected toggleSelection(transaction: Transaction, event: Event) {
        const isChecked = (event.target as HTMLInputElement).checked;
        this.selectedTransactions = isChecked
            ? [...this.selectedTransactions, transaction]
            : this.selectedTransactions.filter(t => t !== transaction);
    }

    protected async addFilterParam(filter: any) {
        this.router.navigate([], { queryParams: filter, queryParamsHandling: 'merge' });
        await this.getTransactions();
    }

    protected async resetFilters() {
        this.selectedName.reset('');
        this.selectedPaymentMethod.reset('');
        this.selectedTransactionType.reset('');
        this.router.navigate([], { queryParams: {} });
        await this.getTransactions();
    }

    protected async removeNameFilter() {
        this.selectedName.reset('');
        this.page = 1;
        await this.addFilterParam({ name: null });
    }

    protected async onTransactionTypeChange() {
        this.page = 1;
        await this.addFilterParam({ type: this.selectedTransactionType.value });
    }

    protected async onPaymentMethodChange() {
        this.page = 1;
        await this.addFilterParam({ paymentMethod: this.selectedPaymentMethod.value });
    }

    protected async searchByName() {
        this.page = 1;
        await this.addFilterParam({ name: this.selectedName.value });
    }

    protected formatMoneyToString(amount: number) {
        return formatMoneyToString(amount);
    }

    protected formatDate(date: string) {
        return formatDate(new Date(date), this.languageService);
    }

    protected async nextPage() {
        if ((this.page * this.offset) < this.transactionsCount) {
            this.page++;
            await this.addFilterParam({ page: this.page });
        }
    }

    protected async previousPage() {
        if (this.page > 1) {
            this.page--;
            await this.addFilterParam({ page: this.page });
        }
    }

    protected get startIndex(): number {
        return (this.page - 1) * this.offset + 1;
    }

    protected get endIndex(): number {
        return Math.min(this.page * this.offset, this.transactionsCount);
    }

    protected makeTransaction(): void {
        const dialogRef = this.dialog.open(MakeTransactionsModalComponent);
        dialogRef.closed.pipe(take(1)).subscribe(async (result) => {
            if (!result) return;
            this.page = 1;
            await this.getTransactions();
        });
    }

    protected async tryAgain() {
        this.page = 1;
        this.resetFilters();
    }

    protected async deleteTransactions() {
        if (!this.selectedTransactions) return;

        const dialogRef = this.dialog.open(DeleteTransactionsModalComponent);
        const result = await firstValueFrom(dialogRef.closed);
        if (!result) {
            this.isLoading = false;
            return;
        }

        this.isLoading = true;
        this.isError = false;

        try {
            const account = await firstValueFrom(this.accountService.getAccount());
            for (const transaction of this.selectedTransactions) {
                await firstValueFrom(this.transactionsService.deleteTransaction(transaction.id, account.id));
            }

            await this.getTransactions();
        } catch (response: any) {
            this.isError = true;
            toast.error(response.error.message);
        }

        this.selectedTransactions = [];
        this.isLoading = false;
    }

    protected async getTransactions() {
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
            this.transactionsCount = +transactionsCount;

        } catch (response: any) {
            this.transactions = [];
            this.transactionsCount = 0;
            this.isError = true;

            if (response instanceof HttpErrorResponse) {
                if (response.status === 400) {
                    const errorsZod = response.error as BadRequestError;
                    // toast.error(errorsZod.message);

                    errorsZod.errors.forEach((error) => {
                        if (error.path  === 'accountId') {
                            const msg = this.translateService.instant('errors.transactions.get.accountId');
                            toast.error(msg, { duration: 5000 });
                        } else if (error.path === 'page') {
                            const msg = this.translateService.instant('errors.transactions.get.page');
                            toast.error(msg, { duration: 5000 });
                        } else if (error.path === 'offset') {
                            const msg = this.translateService.instant('errors.transactions.get.offset');
                            toast.error(msg, { duration: 5000 });
                        } else if (error.path === 'type') {
                            const msg = this.translateService.instant('errors.transactions.get.type');
                            toast.error(msg, { duration: 5000 });
                        } else if (error.path === 'paymentMethod') {
                            const msg = this.translateService.instant('errors.transactions.get.paymentMethod');
                            toast.error(msg, { duration: 5000 });
                        } else if (error.path === 'name') {
                            const msg = this.translateService.instant('errors.transactions.get.name');
                            toast.error(msg, { duration: 5000 });
                        } else {
                            toast.error(`${error.path} - ${error.message}`, { duration: 5000 });
                        }
                    });
                } else if (response.status === 401) {
                    const msg = this.translateService.instant('errors.transactions.unauthorized');
                    toast.error(msg);
                } else {
                    toast.error(response.error.message);
                }
            }
        }

        this.isLoading = false;
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
