import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { formatDate } from '../../helpers/formate-date';
import { Component, inject, OnDestroy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toast } from 'ngx-sonner';
import { take, firstValueFrom, Subject, takeUntil } from 'rxjs';
import { formatMoneyToString } from '../../helpers/format-money';
import { AccountService } from '../../services/account.service';
import { LanguageService } from '../../services/language.service';
import { TranslateModule } from '@ngx-translate/core';
import { Bill, BillService, FindManyBillsInput } from '../../services/bill.service';
import { MakeBillModalComponent } from '../../components/make-bill-modal/make-bill-modal.component';
import { ActivatedRoute, Router } from '@angular/router';
import { DeleteBillModalComponent } from '../../components/delete-bill-modal/delete-bill-modal.component';
import { PayInvoiceModalComponent } from '../../components/pay-invoice-modal/pay-invoice-modal.component';

@Component({
    selector: 'app-bills',
    imports: [CommonModule, ReactiveFormsModule, DialogModule, TranslateModule],
    templateUrl: './bills.component.html'
})
export class BillsComponent implements OnDestroy {
    protected readonly toast = toast;
    billService = inject(BillService);
    accountService = inject(AccountService);
    dialog = inject(Dialog);
    languageService = inject(LanguageService);
    router = inject(Router);
    route = inject(ActivatedRoute);

    bills: Bill[] = [];
    billsCount: number = 0;
    offset: number = 5;
    page: number = 1;

    selectedName = new FormControl('');
    selectedActive = new FormControl('');
    selecteBillType = new FormControl('');
    selectedFrequency = new FormControl('');

    selectedBills: Bill[] = [];

    isLoading = true;
    isError = false;

    private destroy$ = new Subject<void>();

    async ngOnInit() {
        this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
            this.selectedName.setValue(params['name'] || '');
            this.selectedActive.setValue(params['active'] || '');
            this.selecteBillType.setValue(params['billType'] || '');
            this.selectedFrequency.setValue(params['frequency'] || '');
            this.page = params['page'] ? Number(params['page']) : 1;
        });

        await this.getBills();
    }

    async resetFilters() {
        this.page = 1;
        this.router.navigate([], { queryParams: {} });
        this.selectedName.reset('');
        this.selectedActive.reset('');
        this.selecteBillType.reset('');
        this.selectedFrequency.reset('');
        await this.getBills();
    }

    toggleAllSelection(event: Event) {
        const isChecked = (event.target as HTMLInputElement).checked;

        if (isChecked && this.billsCount > 0 && this.bills) {
            this.selectedBills = [...this.bills];
        } else {
            this.selectedBills = [];
        }
    }

    toggleSelection(bill: Bill, event: Event) {
        const isChecked = (event.target as HTMLInputElement).checked;

        if (isChecked) {
            this.selectedBills.push(bill);
        } else {
            this.selectedBills = this.selectedBills.filter((t) => t !== bill);
        }
    }

    async removeNameFilter() {
        this.selectedName.reset('');
        this.page = 1;
        await this.addFilterParam({ name: null });
    }

    async searchByName() {
        this.page = 1;
        await this.addFilterParam({ name: this.selectedName.value });
    }

    formatMoneyToString(amount: number){
        return formatMoneyToString(amount);
    }

    formatDate(date: string){
        return formatDate(new Date(date), this.languageService);
    }

    async nextPage() {
        if ((this.page * this.offset) < this.billsCount) {
            this.page++;
            await this.addFilterParam({ page: this.page });
        }
    }

    async previousPage() {
        if (this.page > 1) {
            this.page--;
            await this.addFilterParam({ page: this.page });
        }
    }

    get startIndex(): number {
        return (this.page - 1) * this.offset + 1;
    }

    get endIndex(): number {
        return Math.min(this.page * this.offset, this.billsCount);
    }

    async addFilterParam(filter: any) {
        this.router.navigate([], { queryParams: filter, queryParamsHandling: 'merge' });
        await this.getBills();
    }

    async onActiveChange() {
        this.page = 1;
        await this.addFilterParam({ active: this.selectedActive.value });
    }

    async onBillTypeChange() {
        this.page = 1;
        await this.addFilterParam({ billType: this.selecteBillType.value });
    }

    async onFrequencyChange() {
        this.page = 1;
        await this.addFilterParam({ frequency: this.selectedFrequency.value });
    }

    async makeBill() {
        const dialogRef = this.dialog.open(MakeBillModalComponent);

        dialogRef.closed.pipe(take(1)).subscribe(async (result) => {
            if (!result) return;

            this.page = 1;
            await this.resetFilters();
        });
    }

    async getBills(){
        this.isLoading = true;
        this.isError = false;

        try {
            const account = await firstValueFrom(this.accountService.getAccount());

            const data = {
                accountId: account.id,
                page: this.page,
                offset: this.offset,
                ...(this.selectedName.value ? { name: this.selectedName.value } : {}),
                ...(this.selecteBillType.value ? { billType: this.selecteBillType.value } : {}),
                ...(this.selectedActive.value ? { active: this.selectedActive.value } : {}),
                ...(this.selectedFrequency.value ? { frequency: this.selectedFrequency.value } : {})
            };

            const { bills, billsCount } = await firstValueFrom(this.billService.getBills(data as FindManyBillsInput));

            this.bills = bills;
            this.billsCount = billsCount;
        } catch (error: any) {
            this.bills = [];
            this.billsCount = 0;
            this.isError = true;
            toast.error(error.message);
        }

        this.isLoading = false;
    }

    async deleteBills() {
        if (!this.selectedBills) return;

        const dialogRef = this.dialog.open(DeleteBillModalComponent);
        const result = await firstValueFrom(dialogRef.closed);
        if (!result) {
            this.isLoading = false;
            return;
        }

        this.isLoading = true;
        this.isError = false;

        try {
            const account = await firstValueFrom(this.accountService.getAccount());

            for (const bill of this.selectedBills) {
                await firstValueFrom(this.billService.deleteBill(bill.id, account.id));
            }

            await this.getBills();
        } catch (error: any) {
            this.isError = true;
            toast.error(error.message);
        }

        this.selectedBills = [];
        this.isLoading = false;
    }

    async payInvoice() {
        if (!this.selectedBills) return;

        const dialogRef = this.dialog.open(PayInvoiceModalComponent);
        const result = await firstValueFrom(dialogRef.closed);
        if (!result) {
            this.isLoading = false;
            return;
        }

        this.isLoading = true;
        this.isError = false;

        try {
            const account = await firstValueFrom(this.accountService.getAccount());

            const bill = this.selectedBills[0];
            await firstValueFrom(this.billService.payInvoice(bill.id, account.id));
            this.accountService.fetchAccountSubject.next();

            await this.getBills();
        } catch (error: any) {
            this.isError = true;
            toast.error(error.message);
        }

        this.selectedBills = [];
        this.isLoading = false;
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
