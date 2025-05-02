import { Component, inject, OnInit } from '@angular/core';
import { Transaction, TransactionsService } from '../../services/transactions.service';
import { firstValueFrom } from 'rxjs';
import { AccountService } from '../../services/account.service';
import { RouterLink } from '@angular/router';
import { formatMoneyToString } from '../../helpers/format-money';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DateTime } from 'luxon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { toast } from 'ngx-sonner';
import { HttpErrorResponse } from '@angular/common/http';
import { BadRequestError } from '../../interfaces/bad-request-error.interface';
import { TIMEZONE } from '../../helpers/timezone';
import { DATE_FORMAT } from '../../helpers/date-format';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BillService } from '../../services/bill.service';

interface Period {
    today: DateTime;
    thirtyOneDaysAgo: DateTime;
    sixtyTwoDaysAgo: DateTime;
  }

@Component({
    selector: 'app-home',
    imports: [RouterLink, ReactiveFormsModule, TranslateModule, MatTooltipModule],
    templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
    protected translateService = inject(TranslateService);
    protected transactionsService = inject(TransactionsService);
    protected accountService = inject(AccountService);
    protected billsService = inject(BillService);

    protected readonly toast = toast;

    protected transactionsCount: number = 0;
    protected totalMoneyMovimented: number = 0;
    protected transactionsCountChangePercent: string = '0';
    protected transactionsTotalMoneyChangePercent: string = '0';

    protected newBills: number = 0;
    protected activeBills: number = 0;
    protected billsCountChangePercent: string = '0';

    protected datePeriod: Period | undefined = undefined;
    protected dateSelected = new FormControl();

    protected isLoading = true;
    protected isError = false;

    async ngOnInit() {
        this.dateSelected.setValue(this.isoToday());
        this.setUpDate();
        await this.getTransactionsInPeriod();
        await this.getBillsInPeriod();
    }

    protected async onChangeDate(){
        this.setUpDate();
        await this.getTransactionsInPeriod();
    }

    protected setUpDate() {
        const dateSelectedValue = this.dateSelected.value;
        const today = DateTime.fromISO(dateSelectedValue, { zone: TIMEZONE });
        const thirtyOneDaysAgo = today.minus({ days: 31 });
        const sixtyTwoDaysAgo = thirtyOneDaysAgo.minus({ days: 31 });

        // console.log(today.toISODate(), thirtyOneDaysAgo.toISODate(), sixtyTwoDaysAgo.toISODate());
        this.datePeriod = { today, thirtyOneDaysAgo, sixtyTwoDaysAgo };
    }

    protected async tryAgain() {
        this.dateSelected.setValue(this.isoToday());
        this.setUpDate();
        await this.getTransactionsInPeriod();
    }

    private isoToday() {
        return DateTime.now().setZone(TIMEZONE).toISODate();
    }

    protected async getTransactionsInPeriod() {
        this.isLoading = true;
        this.isError = false;

        if (!this.datePeriod) {
            toast.error('Date period error');
            return;
        }

        const today = this.datePeriod.today.setZone(TIMEZONE).toFormat(DATE_FORMAT);
        const thirtyOneDaysAgo = this.datePeriod.thirtyOneDaysAgo.setZone(TIMEZONE).toFormat(DATE_FORMAT);
        const sixtyTwoDaysAgo = this.datePeriod.sixtyTwoDaysAgo.setZone(TIMEZONE).toFormat(DATE_FORMAT);

        try {
            const account = await firstValueFrom(this.accountService.getAccount());

            const { transactions, transactionsCount } = await firstValueFrom(
                this.transactionsService.getTransactionsInPeriod(account.id, thirtyOneDaysAgo, today));

            this.transactionsCount = transactionsCount;
            this.totalMoneyMovimented = transactions.reduce((total, transaction) => total + transaction.amount, 0);

            const previousPeriodData = await firstValueFrom(
                this.transactionsService.getTransactionsInPeriod(account.id,sixtyTwoDaysAgo, thirtyOneDaysAgo));

            const previousPeriodTotal = previousPeriodData.transactions.reduce((total, transaction) => total + transaction.amount, 0);

            this.transactionsCountChangePercent = this.calculatePercentageDifference(this.transactionsCount, previousPeriodData.transactionsCount);
            this.transactionsTotalMoneyChangePercent = this.calculatePercentageDifference(this.totalMoneyMovimented, previousPeriodTotal);

            this.isError = false;
        } catch (response: any) {
            if (response instanceof HttpErrorResponse) {
                if (response.status === 400) {
                    const errorsZod = response.error as BadRequestError;
                    this.isError = true;

                    errorsZod.errors.forEach((error) => {
                        if (error.path  === 'endDate') {
                            const msg = this.translateService.instant('errors.home.dateRange');
                            toast.error(msg, { duration: 5000 });
                        } else if (error.path  === 'startDate') {
                            const msg = this.translateService.instant('errors.home.dateRange');
                            toast.error(msg, { duration: 5000 });
                        } else {
                            toast.error(`${error.path} - ${error.message}`, { duration: 5000 });
                        }
                    });
                } else {
                    toast.error(response.error.message);
                }
            }
        }

        this.isLoading = false;
    }

    protected async getBillsInPeriod() {
        this.isLoading = true;
        this.isError = false;

        if (!this.datePeriod) {
            toast.error('Date period error');
            return;
        }

        const today = this.datePeriod.today.setZone(TIMEZONE).toFormat(DATE_FORMAT);
        const thirtyOneDaysAgo = this.datePeriod.thirtyOneDaysAgo.setZone(TIMEZONE).toFormat(DATE_FORMAT);
        const sixtyTwoDaysAgo = this.datePeriod.sixtyTwoDaysAgo.setZone(TIMEZONE).toFormat(DATE_FORMAT);

        try {
            const account = await firstValueFrom(this.accountService.getAccount());

            const { bills, billsCount } = await firstValueFrom(this.billsService.getBillsInPeriod(account.id, thirtyOneDaysAgo, today));

            this.newBills = billsCount;
            this.activeBills = bills.reduce((total, bill) => total + (bill.active ? 1 : 0), 0);

            const previousPeriodData = await firstValueFrom(this.billsService.getBillsInPeriod(account.id, sixtyTwoDaysAgo, thirtyOneDaysAgo));
            this.billsCountChangePercent = this.calculatePercentageDifference(this.newBills, previousPeriodData.billsCount);

            this.isError = false;
        } catch (response: any) {
            if (response instanceof HttpErrorResponse) {
                if (response.status === 400) {
                    const errorsZod = response.error as BadRequestError;
                    this.isError = true;

                    errorsZod.errors.forEach((error) => {
                        if (error.path  === 'endDate') {
                            const msg = this.translateService.instant('errors.home.dateRange');
                            toast.error(msg, { duration: 5000 });
                        } else if (error.path  === 'startDate') {
                            const msg = this.translateService.instant('errors.home.dateRange');
                            toast.error(msg, { duration: 5000 });
                        } else {
                            toast.error(`${error.path} - ${error.message}`, { duration: 5000 });
                        }
                    });
                } else {
                    toast.error(response.error.message);
                }
            }
        }

        this.isLoading = false;
    }

    protected calculatePercentageDifference(current: number, previous: number): string {
        const baseline = previous === 0 ? 1 : Math.abs(previous);
        const difference = ((current - previous) / baseline) * 100;
        return difference.toFixed(2);
    }

    protected formatMoneyToString(amount: number) {
        return formatMoneyToString(amount);
    }
}
