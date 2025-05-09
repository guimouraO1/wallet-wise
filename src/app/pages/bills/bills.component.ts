import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { formatDate } from '../../helpers/formate-date';
import { Component, inject, OnDestroy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toast } from 'ngx-sonner';
import { take, firstValueFrom, Subject, takeUntil } from 'rxjs';
import { formatMoneyToString } from '../../helpers/format-money';
import { Account, AccountService } from '../../services/account.service';
import { LanguageService } from '../../services/language.service';
import { TranslateModule } from '@ngx-translate/core';
import { Bill, BillService, FindManyBillsInput } from '../../services/bill.service';
import { MakeBillModalComponent } from '../../components/make-bill-modal/make-bill-modal.component';
import { ActivatedRoute, Router } from '@angular/router';
import { DeleteBillModalComponent } from '../../components/delete-bill-modal/delete-bill-modal.component';
import { PayInvoiceModalComponent } from '../../components/pay-invoice-modal/pay-invoice-modal.component';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'app-bills',
    imports: [CommonModule, ReactiveFormsModule, DialogModule, TranslateModule, MatTooltipModule],
    templateUrl: './bills.component.html'
})
export class BillsComponent implements OnDestroy {
    protected billService = inject(BillService);
    protected accountService = inject(AccountService);
    protected dialog = inject(Dialog);
    protected languageService = inject(LanguageService);
    protected router = inject(Router);
    protected route = inject(ActivatedRoute);

    protected readonly toast = toast;

    protected bills: Bill[] = [];
    protected billsCount: number = 0;

    protected offset: number = 5;
    protected page: number = 1;

    protected selectedName = new FormControl('');
    protected selectedActive = new FormControl('');
    protected selecteBillType = new FormControl('');
    protected selectedFrequency = new FormControl('');

    protected selectedBills: Bill[] = [];

    protected isLoading = true;
    protected isError = false;

    private destroy$ = new Subject<void>();

    protected account: Account | undefined;

    async ngOnInit() {
        this.account = await firstValueFrom(this.accountService.getAccount());

        this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
            this.selectedName.setValue(params['name'] || '');
            this.selectedActive.setValue(params['active'] || '');
            this.selecteBillType.setValue(params['billType'] || '');
            this.selectedFrequency.setValue(params['frequency'] || '');
            this.page = params['page'] ? Number(params['page']) : 1;
        });

        await this.getBills();
    }

    protected async resetFilters() {
        this.page = 1;
        this.router.navigate([], { queryParams: {} });
        this.selectedName.reset('');
        this.selectedActive.reset('');
        this.selecteBillType.reset('');
        this.selectedFrequency.reset('');
        await this.getBills();
    }

    protected toggleAllSelection(event: Event) {
        const isChecked = (event.target as HTMLInputElement).checked;

        if (isChecked && this.billsCount > 0 && this.bills) {
            this.selectedBills = [...this.bills];
        } else {
            this.selectedBills = [];
        }
    }

    protected toggleSelection(bill: Bill, event: Event) {
        const isChecked = (event.target as HTMLInputElement).checked;

        if (isChecked) {
            this.selectedBills.push(bill);
        } else {
            this.selectedBills = this.selectedBills.filter((t) => t !== bill);
        }
    }

    protected async removeNameFilter() {
        this.selectedName.reset('');
        this.page = 1;
        await this.addFilterParam({ name: null });
    }

    protected async searchByName() {
        this.page = 1;
        await this.addFilterParam({ name: this.selectedName.value });
    }

    protected formatMoneyToString(amount: number){
        return formatMoneyToString(amount);
    }

    protected formatDate(date: string){
        return formatDate(new Date(date), this.languageService);
    }

    protected async nextPage() {
        if ((this.page * this.offset) < this.billsCount) {
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
        return Math.min(this.page * this.offset, this.billsCount);
    }

    protected async addFilterParam(filter: any) {
        this.router.navigate([], { queryParams: filter, queryParamsHandling: 'merge' });
        await this.getBills();
    }

    protected async onActiveChange() {
        this.page = 1;
        await this.addFilterParam({ active: this.selectedActive.value });
    }

    protected async onBillTypeChange() {
        this.page = 1;
        await this.addFilterParam({ billType: this.selecteBillType.value });
    }

    protected async onFrequencyChange() {
        this.page = 1;
        await this.addFilterParam({ frequency: this.selectedFrequency.value });
    }

    protected async makeBill() {
        const dialogRef = this.dialog.open(MakeBillModalComponent);

        dialogRef.closed.pipe(take(1)).subscribe(async (result) => {
            if (!result) return;

            this.page = 1;
            await this.resetFilters();
        });
    }

    protected async getBills(){
        if (!this.account) {
            toast.error('Account not found');
            return;
        }

        this.isLoading = true;
        this.isError = false;

        try {
            const data = {
                accountId: this.account.id,
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
        } catch (response: any) {
            this.bills = [];
            this.billsCount = 0;
            this.isError = true;

            toast.error(response.error.message);
        }

        this.isLoading = false;
    }

    protected async deleteBills() {
        if (!this.account) {
            toast.error('Account not found');
            return;
        }

        const dialogRef = this.dialog.open(DeleteBillModalComponent);
        const result = await firstValueFrom(dialogRef.closed);
        if (!result) {
            this.isLoading = false;
            return;
        }

        this.isLoading = true;
        this.isError = false;

        try {
            for (const bill of this.selectedBills) {
                await firstValueFrom(this.billService.deleteBill(bill.id, this.account.id));
            }

            await this.getBills();
        } catch (response: any) {
            this.isError = true;
            toast.error(response.error.message);
        }

        this.selectedBills = [];
        this.isLoading = false;
    }

    protected async payInvoice() {
        if (!this.account) {
            toast.error('Account not found');
            return;
        }

        const dialogRef = this.dialog.open(PayInvoiceModalComponent);
        const result = await firstValueFrom(dialogRef.closed);
        if (!result) {
            this.isLoading = false;
            return;
        }

        this.isLoading = true;
        this.isError = false;

        try {
            const bill = this.selectedBills[0];
            await firstValueFrom(this.billService.payInvoice(bill.id, this.account.id));
            this.accountService.fetchAccountSubject.next();

            await this.getBills();
        } catch (response: any) {
            this.isError = true;
            toast.error(response.error.message);
        }

        this.selectedBills = [];
        this.isLoading = false;
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
