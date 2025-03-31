import { Component } from '@angular/core';
import { Color, NgxChartsModule, ScaleType } from '@swimlane/ngx-charts';
import {
    CdkDragDrop,
    moveItemInArray,
    transferArrayItem,
    CdkDrag,
    CdkDropList
  } from '@angular/cdk/drag-drop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
    selector: 'app-home',
    imports: [NgxChartsModule, CdkDropList, CdkDrag, ReactiveFormsModule],
    templateUrl: './home.component.html'
})
export class HomeComponent {
    done: string[] = [];
    todo: string[] = [];
    todoInput = new FormControl<string>('', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]);

    data = [
        { 'name': 'Julho', 'value': 4800 },
        { 'name': 'Agosto', 'value': 6000 },
        { 'name': 'Setembro', 'value': 4300 },
        { 'name': 'Outubro', 'value': 3700 },
        { 'name': 'Novembro', 'value': 5100 },
        { 'name': 'Dezembro', 'value': 5200 }
    ];

    colorScheme: Color = {
        domain: ['#81a1c1', '#a3be8d', '#bf616a', '#ebcb8b', '#00baa6', '#8c4fff'],
        name: 'testando',
        selectable: false,
        group: ScaleType.Time
    };

    drop(event: CdkDragDrop<string[]>) {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else {
            transferArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex
        );
        }
    }

    addToDo() {
        if (!this.todoInput.value) return;
        this.todo.push(this.todoInput.value);
        this.todoInput.reset('');
    }
}
