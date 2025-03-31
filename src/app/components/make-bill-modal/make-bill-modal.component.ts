import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { ThemeService } from '../../services/theme.service';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { toast, NgxSonnerToaster } from 'ngx-sonner';
import { CommonModule } from '@angular/common';
import { AccountService } from '../../services/account.service';
import { firstValueFrom } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { BillCreateInput, BillService } from '../../services/bill.service';
import { NgxMaskDirective } from 'ngx-mask';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideNativeDateAdapter } from '@angular/material/core';

@Component({
    selector: 'app-make-bill-modal',
    imports: [ReactiveFormsModule, FormsModule, NgxSonnerToaster,
        CommonModule, TranslateModule, NgxMaskDirective, MatFormFieldModule, MatInputModule, MatDatepickerModule],
    templateUrl: './make-bill-modal.component.html',
    providers: [provideNativeDateAdapter()],
    changeDetection: ChangeDetectionStrategy.OnPush

})
export class MakeBillModalComponent {
    protected readonly toast = toast;
    dialogRef = inject(DialogRef);
    themeService = inject(ThemeService);
    accountService = inject(AccountService);
    billService = inject(BillService);

    isLoading = false;
    makeBillForm = new FormGroup({
        accountId: new FormControl(''),
        name: new FormControl('', [Validators.required, Validators.minLength(3)]),
        description: new FormControl('', [Validators.minLength(3)]),
        amount: new FormControl(0, [Validators.required, Validators.min(0.01)]),

        dueDate: new FormControl(new Date(), [Validators.required]),
        installmentDay: new FormControl(1, [Validators.required, Validators.min(1), Validators.max(31)]),
        installments: new FormControl(1, [Validators.required, Validators.min(1)]),
        paidInstallments: new FormControl(undefined)
    });

    closeDialog(response: boolean = false) {
        this.dialogRef.close(response);
    }

    async makeBill() {
        this.isLoading = true;
        try {
            const account = await firstValueFrom(this.accountService.getAccount());
            this.makeBillForm.get('accountId')?.setValue(account.id);

            if(!this.makeBillForm.get('dueDate')?.value) return;

            const formValue = {
                dueDate: this.makeBillForm.value.dueDate ? new Date(this.makeBillForm.value.dueDate) : null,
                name: this.makeBillForm.value.name,
                amount: this.makeBillForm.value.amount,
                installmentDay: this.makeBillForm.value.installmentDay,
                installments: this.makeBillForm.value.installments,
                accountId: this.makeBillForm.value.accountId,
                ...(this.makeBillForm.value.description ? { description: this.makeBillForm.value.description } : {}),
                ...(this.makeBillForm.value.paidInstallments != null ? { paidInstallments: this.makeBillForm.value.paidInstallments } : {})
            };

            await firstValueFrom(this.billService.makeBill(formValue as BillCreateInput));
            this.closeDialog(true);
        } catch (error) {
            toast.error('Error in make Transaction');
        }

        this.isLoading = false;
    }
}
