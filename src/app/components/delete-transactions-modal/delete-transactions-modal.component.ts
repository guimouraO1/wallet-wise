import { Component, inject } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { ThemeService } from '../../services/theme.service';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-make-transactino-modal',
    imports: [CommonModule, TranslateModule],
    templateUrl: './delete-transactions-modal.component.html'
})
export class DeleteTransactionsModalComponent {
    dialogRef = inject(DialogRef);
    themeService = inject(ThemeService);

    closeDialog(response: boolean = false) {
        this.dialogRef.close(response);
    }
}
