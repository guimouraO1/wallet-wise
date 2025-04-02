import { Component, inject, OnInit } from '@angular/core';
import { Transaction, TransactionsService } from '../../services/transactions.service';
import { firstValueFrom } from 'rxjs';
import { AccountService } from '../../services/account.service';
import { RouterLink } from '@angular/router';
import { formatMoneyToString } from '../../helpers/format-money';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DateTime } from 'luxon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-home',
    imports: [RouterLink, ReactiveFormsModule, TranslateModule],
    templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
    transactionsService = inject(TransactionsService);
    accountService = inject(AccountService);

    transactionsCount: number | undefined = 0;
    transactions: Transaction[] | undefined;
    totalMoneyMovimented: number = 0;
    totalBillsPaid: number = 0;

    percentageDifferenceInTransactionsCount: number = 0;
    percentageDifferenceInTransactions: number = 0;

    thisMonth = new FormControl(DateTime.now().setZone('America/Sao_Paulo').endOf('day').toISODate() as string);
    thisMonthInit = new FormControl();
    oneMonthAgo = new FormControl();

    isLoading = true;
    isError = false;

    async ngOnInit() {
        this.setUpDate();
        await this.getTransactionsInPeriod();
    }

    async onChangeDate(){
        await this.getTransactionsInPeriod();
    }

    setUpDate() {
        const thisMonth = this.thisMonth.value as string;
        const thisMonthInit = DateTime.fromISO(thisMonth).minus({ month: 1 }).startOf('day').setZone('America/Sao_Paulo').toISODate() as string;
        const oneMonthAgo = DateTime.fromISO(thisMonthInit).minus({ month: 1 }).startOf('day').setZone('America/Sao_Paulo').toISODate() as string;

        this.thisMonth.setValue(thisMonth);
        this.thisMonthInit.setValue(thisMonthInit);
        this.oneMonthAgo.setValue(oneMonthAgo);
    }

    async getTransactionsInPeriod() {
        this.isLoading = true;
        this.isError = false;
        try {
            const account = await firstValueFrom(this.accountService.getAccount());
            const { transactions, transactionsCount } = await firstValueFrom(this.transactionsService.getTransactionsInPeriod(account.id,
                    this.thisMonthInit.value, this.thisMonth.value as string));

            this.transactions = transactions;
            this.transactionsCount = transactionsCount;
            this.totalMoneyMovimented = transactions.reduce((total, transaction) => total + transaction.amount, 0);

            const transactionsTwoMonths = await firstValueFrom(this.transactionsService.getTransactionsInPeriod(account.id,
                this.oneMonthAgo.value, this.thisMonthInit.value));

            const totalMoneyMovimentedLastMonth = transactionsTwoMonths.transactions.reduce((total, transaction) => total + transaction.amount, 0);

            this.percentageDifferenceInTransactionsCount = this.calculatePercentageDifference(this.transactionsCount, transactionsTwoMonths.transactionsCount);
            this.percentageDifferenceInTransactions = this.calculatePercentageDifference(this.totalMoneyMovimented, totalMoneyMovimentedLastMonth);
            this.isError = false;

        } catch (error) {
            this.isError = true;
        }
        this.isLoading = false;
    }

    calculatePercentageDifference(currentCount: number, previousCount: number) {
        if (previousCount === 0) {
            return currentCount === 0 ? 0 : currentCount * 100;
        } else if (currentCount === 0) {
            return -previousCount * 100;
        } else {
            return Math.round(((currentCount - previousCount) * 100) / previousCount);
        }
    }

    formatMoneyToString(amount: number) {
        return formatMoneyToString(amount);
    }
}
