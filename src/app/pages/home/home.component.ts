import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { TransactionsService, TransactionsYearResponse, TransactionTypes } from '../../services/transactions.service';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { Account, AccountService } from '../../services/account.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { formatMoneyToString } from '../../helpers/format-money';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DateTime } from 'luxon';
import { LangChangeEvent, TranslateModule, TranslateService } from '@ngx-translate/core';
import { toast } from 'ngx-sonner';
import { HttpErrorResponse } from '@angular/common/http';
import { BadRequestError } from '../../interfaces/bad-request-error.interface';
import { TIMEZONE } from '../../helpers/timezone';
import { DATE_FORMAT } from '../../helpers/date-format';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BillService } from '../../services/bill.service';
import { NgxChartsModule, ScaleType } from '@swimlane/ngx-charts';
import { CommonModule } from '@angular/common';

interface Period {
    today: DateTime;
    thirtyOneDaysAgo: DateTime;
    sixtyTwoDaysAgo: DateTime;
}

@Component({
    selector: 'app-home',
    imports: [RouterLink, ReactiveFormsModule, TranslateModule, MatTooltipModule, NgxChartsModule, CommonModule],
    templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit, OnDestroy {
    protected translateService = inject(TranslateService);
    protected transactionsService = inject(TransactionsService);
    protected accountService = inject(AccountService);
    protected billsService = inject(BillService);
    protected router = inject(Router);
    protected route = inject(ActivatedRoute);

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
    protected isLoadingCharData = true;
    protected isError = false;

    protected chartData: TransactionsYearResponse = [];

    protected showXAxis = true;
    protected showYAxis = true;
    protected gradient = false;
    protected showLegend = true;
    protected showXAxisLabel = true;
    protected showYAxisLabel = true;

    protected selectedTransactionType = new FormControl<TransactionTypes | ''>('');

    protected colorScheme = {
        domain: ['#007595', '#fcb700', '#ff9fa0', '#61738d',  '#7af1a7', '#f82834'],
        group: ScaleType.Ordinal,
        selectable: true,
        name: 'customScheme'
    };
    // protected colorScheme = 'dark';

    private destroy$ = new Subject<void>();

    protected account: Account | undefined;

    async ngOnInit() {
        this.dateSelected.setValue(this.isoToday());
        this.setUpDate();

        await this.initialize();
        await this.getTransactionsInPeriod();
        await this.getBillsInPeriod();
        await this.getYearTransactionsTotal();
    }

    private async initialize(): Promise<void> {
        this.account = await firstValueFrom(this.accountService.getAccount());

        this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
            this.selectedTransactionType.setValue(params['type'] || '');
        });

        this.translateService.onLangChange.pipe(takeUntil(this.destroy$)).subscribe(async (event: LangChangeEvent) => {
            await this.getYearTransactionsTotal();
        });
    }

    protected async onTransactionTypeChange() {
        await this.addFilterParam({ type: this.selectedTransactionType.value });
    }

    protected async onChangeDate(){
        this.setUpDate();
        await this.getTransactionsInPeriod();
        await this.getYearTransactionsTotal();
    }

    protected async addFilterParam(filter: any) {
        this.router.navigate([], { queryParams: filter, queryParamsHandling: 'merge' });
        await this.getTransactionsInPeriod();
        await this.getYearTransactionsTotal();
    }

    protected setUpDate() {
        const dateSelectedValue = this.dateSelected.value;
        const today = DateTime.fromISO(dateSelectedValue, { zone: TIMEZONE });
        const thirtyOneDaysAgo = today.minus({ days: 31 });
        const sixtyTwoDaysAgo = thirtyOneDaysAgo.minus({ days: 31 });

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

        if (!this.account) {
            toast.error('Account not found');
            return;
        }

        if (!this.datePeriod) {
            toast.error('Date period error');
            return;
        }

        const today = this.datePeriod.today.setZone(TIMEZONE).toFormat(DATE_FORMAT);
        const thirtyOneDaysAgo = this.datePeriod.thirtyOneDaysAgo.setZone(TIMEZONE).toFormat(DATE_FORMAT);
        const sixtyTwoDaysAgo = this.datePeriod.sixtyTwoDaysAgo.setZone(TIMEZONE).toFormat(DATE_FORMAT);

        try {
            const { transactions, transactionsCount } = await firstValueFrom(
                this.transactionsService.getTransactionsInPeriod({ accountId: this.account.id, startDate: thirtyOneDaysAgo,
                    endDate: today, type: this.selectedTransactionType.value ?? '' }));

            this.transactionsCount = transactionsCount;
            this.totalMoneyMovimented = transactions.reduce((total, transaction) => total + transaction.amount, 0);

            const previousPeriodData = await firstValueFrom(
                this.transactionsService.getTransactionsInPeriod({ accountId: this.account.id, startDate: sixtyTwoDaysAgo,
                    endDate: thirtyOneDaysAgo, type: this.selectedTransactionType.value ?? '' }));

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

        if (!this.account) {
            toast.error('Account not found');
            return;
        }

        if (!this.datePeriod) {
            toast.error('Date period error');
            return;
        }

        const today = this.datePeriod.today.setZone(TIMEZONE).toFormat(DATE_FORMAT);
        const thirtyOneDaysAgo = this.datePeriod.thirtyOneDaysAgo.setZone(TIMEZONE).toFormat(DATE_FORMAT);
        const sixtyTwoDaysAgo = this.datePeriod.sixtyTwoDaysAgo.setZone(TIMEZONE).toFormat(DATE_FORMAT);

        try {
            const { bills, billsCount } = await firstValueFrom(this.billsService.getBillsInPeriod(this.account.id, thirtyOneDaysAgo, today));

            this.newBills = billsCount;
            this.activeBills = bills.reduce((total, bill) => total + (bill.active ? 1 : 0), 0);

            const previousPeriodData = await firstValueFrom(this.billsService.getBillsInPeriod(this.account.id, sixtyTwoDaysAgo, thirtyOneDaysAgo));
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

    protected async getYearTransactionsTotal() {
        this.isLoadingCharData = true;

        if (!this.account) {
            toast.error('Account not found');
            return;
        }

        if (!this.datePeriod) {
            toast.error('Date period error');
            return;
        }

        const thisYear = this.datePeriod.today.setZone(TIMEZONE).toFormat('yyyy');

        try {
            const charData = await firstValueFrom(this.transactionsService.getTransactionsInYear({ accountId: this.account.id, year: thisYear,
                ...(this.selectedTransactionType.value ? { type: this.selectedTransactionType.value }: {} ) }));

            this.chartData = await Promise.all(charData.map(async (item) => ({
                name: await firstValueFrom(this.translateService.get(`months.${item.name.toLowerCase()}`)),
                value: item.value
            })));

        }  catch (response: any) {
            if (response instanceof HttpErrorResponse) {
                if (response.status === 400) {
                    const errorsZod = response.error as BadRequestError;
                    this.isError = true;

                    errorsZod.errors.forEach((error) => {
                        if (error.path  === 'year') {
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

        this.isLoadingCharData = false;
    }

    protected calculatePercentageDifference(current: number, previous: number): string {
        const baseline = previous === 0 ? 1 : Math.abs(previous);
        const difference = ((current - previous) / baseline) * 100;
        return difference.toFixed(2);
    }

    protected formatMoneyToString(amount: number) {
        return formatMoneyToString(amount);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
