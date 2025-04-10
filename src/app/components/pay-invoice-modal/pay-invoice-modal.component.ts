import { Component, inject } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { ThemeService } from '../../services/theme.service';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-pay-invoice-modal',
    imports: [CommonModule, TranslateModule],
    templateUrl: './pay-invoice-modal.component.html'
})
export class PayInvoiceModalComponent {
    dialogRef = inject(DialogRef);
    themeService = inject(ThemeService);

    closeDialog(response: boolean = false) {
        this.dialogRef.close(response);
    }
}
