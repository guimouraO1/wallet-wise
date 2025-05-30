import { Component, EventEmitter, inject, Output } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { ThemeService } from '../../services/theme.service';
import { NgxMaskDirective } from 'ngx-mask';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { toast } from 'ngx-sonner';
import { CommonModule } from '@angular/common';
import { AccountService } from '../../services/account.service';
import { firstValueFrom } from 'rxjs';
import { PayloadMakeTransaction, TransactionsService } from '../../services/transactions.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-make-transactino-modal',
    imports: [NgxMaskDirective, ReactiveFormsModule, FormsModule, CommonModule, TranslateModule],
    templateUrl: './make-transactions-modal.component.html'
})
export class MakeTransactionsModalComponent {
    @Output() updateAccountAmount = new EventEmitter<number>();
    protected readonly toast = toast;
    dialogRef = inject(DialogRef);
    themeService = inject(ThemeService);
    accountService = inject(AccountService);
    transactionsService = inject(TransactionsService);

    isLoading = false;

    makeTransactionForm = new FormGroup({
        name: new FormControl('', [Validators.required, Validators.min(3), Validators.max(200)]),
        amount: new FormControl(0, [Validators.required, Validators.min(0.01), Validators.max(10_000)]),
        type: new FormControl('', [Validators.required]),
        paymentMethod: new FormControl('', [Validators.required]),
        accountId: new FormControl(''),
        description: new FormControl('', Validators.max(500))
    });

    closeDialog(response: boolean = false) {
        this.dialogRef.close(response);
    }

    async makeTransaction() {
        this.isLoading = true;
        try {
            const account = await firstValueFrom(this.accountService.getAccount());
            this.makeTransactionForm.controls.accountId.setValue(account.id);

            await firstValueFrom(this.transactionsService.makeTransaction(this.makeTransactionForm.value as PayloadMakeTransaction));
            this.accountService.fetchAccountSubject.next();
            this.closeDialog(true);
        } catch (error: any) {
            toast.error(error.error.message);
        }
        this.isLoading = false;
    }
}
