import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { formatDate } from '../../helpers/formate-date';
import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { take, firstValueFrom } from 'rxjs';
import { formatMoneyToString } from '../../helpers/format-money';
import { AccountService } from '../../services/account.service';
import { LanguageService } from '../../services/language.service';
import { TranslateModule } from '@ngx-translate/core';
import { Bill, BillService, FindManyBillsInput } from '../../services/bill.service';
import { MakeBillModalComponent } from '../../components/make-bill-modal/make-bill-modal.component';

@Component({
    selector: 'app-bills',
    imports: [CommonModule, ReactiveFormsModule, NgxSonnerToaster, DialogModule, TranslateModule],
    templateUrl: './bills.component.html'
})
export class BillsComponent {
    protected readonly toast = toast;
    billService = inject(BillService);
    accountService = inject(AccountService);
    dialog = inject(Dialog);
    languageService = inject(LanguageService);
    bills: Bill[] | undefined;
    billsCount: number = 0;
    offset: number = 5;
    page: number = 1;

    selectedIsPaid = new FormControl<boolean | undefined>(false);
    selectedName = new FormControl('');

    selectedBills: Bill[] = [];

    async ngOnInit() {
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
        await this.getBills();
    }

    async onIsPaidChange() {
        this.page = 1;
        await this.getBills();
    }

    async searchByName() {
        this.page = 1;
        await this.getBills();
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
        }

        await this.getBills();
    }

    async previousPage() {
        if (this.page > 1) {
            this.page--;
        }

        await this.getBills();
    }

    get startIndex(): number {
        return (this.page - 1) * this.offset + 1;
    }

    get endIndex(): number {
        return Math.min(this.page * this.offset, this.billsCount);
    }

    async makeBill() {
        this.openDialog();
    }

    openDialog(): void {
        const dialogRef = this.dialog.open(MakeBillModalComponent);

        dialogRef.closed.pipe(take(1)).subscribe(async (result) => {
            if (!result) return;

            this.page = 1;
            await this.getBills();
        });
    }

    deleteBills() {
        toast.error('No delete function at all');
        this.selectedBills = [];
    }

    async getBills(){
        try {
            const account = await firstValueFrom(this.accountService.getAccount());

            const data: FindManyBillsInput = {
                accountId: account.id,
                page: this.page,
                offset: this.offset,
                ...(this.selectedName.value ? { name: this.selectedName.value } : {}),
                ...(this.selectedIsPaid.value ? { isPaid: this.selectedIsPaid.value } : {})
            };

            const { bills, billsCount } = await firstValueFrom(this.billService.getBills(data));

            this.bills = bills;
            this.billsCount = billsCount;
        } catch (error) {
            toast.error('Error get Bills');
        }
    }
}
