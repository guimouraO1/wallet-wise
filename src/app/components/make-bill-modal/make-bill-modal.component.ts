import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { ThemeService } from '../../services/theme.service';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { toast } from 'ngx-sonner';
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
    imports: [ReactiveFormsModule, FormsModule,
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
        billType: new FormControl('', [Validators.required]),
        frequency: new FormControl('', [Validators.required]),
        installments: new FormControl<number>(0),
        paidInstallments: new FormControl<number>(0, Validators.required),
        dueDay: new FormControl(1, [Validators.required, this.dayRangeValidator()])
    }, { validators: this.billTypeValidator() });

    closeDialog(response: boolean = false) {
        this.dialogRef.close(response);
    }

    async makeBill() {
        this.isLoading = true;

        try {
            const {
                name,
                amount,
                description,
                dueDay,
                paidInstallments,
                frequency,
                billType
            } = this.makeBillForm.value;

            const installments = this.makeBillForm.get('installments')?.value ?? 0;

            const formValue: any = {
                name,
                amount,
                dueDay,
                paidInstallments,
                frequency,
                billType,
                active: true,
                ...(description ? { description } : {}),
                ...(installments > 0 ? { installments } : {})
            };

            const { id } = await firstValueFrom(this.accountService.getAccount());
            formValue.accountId = id;

            await firstValueFrom(this.billService.makeBill(formValue as BillCreateInput));
            this.closeDialog(true);
        } catch (error) {
            toast.error('Error in make Transaction');
        } finally {
            this.isLoading = false;
        }
    }

    billTypeValidator(): ValidatorFn {
        return (group: AbstractControl): ValidationErrors | null => {
            const type = group.get('billType')?.value;

            if (type !== 'installment') {
                return null;
            }

            const installments = group.get('installments')?.value;
            const paidInstallments = group.get('paidInstallments')?.value;

            if (paidInstallments > installments) {
                return { paidGreaterThanInstallments: true };
            }

            return null;
        };
    }

    dayRangeValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value = +control.value;
            if (isNaN(value) || value < 1 || value > 31) {
                return { outOfRange: true };
            }
            return null;
        };
    }
}
