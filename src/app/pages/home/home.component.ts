import { Component } from '@angular/core';
import { LegendPosition, NgxChartsModule } from '@swimlane/ngx-charts';
import { Color, ScaleType } from '@swimlane/ngx-charts';

export class foo {
    colorScheme: Color = {
        name: 'myScheme',
        selectable: true,
        group: ScaleType.Ordinal,
        domain: ['#f00', '#0f0', '#0ff']
    };
}

@Component({
    selector: 'app-home',
    imports: [NgxChartsModule],
    templateUrl: './home.component.html'
})
export class HomeComponent {
    data = [
        { 'name': 'Julho', 'value': 4800 },
        { 'name': 'Agosto', 'value': 6000 },
        { 'name': 'Setembro', 'value': 4300 },
        { 'name': 'Outubro', 'value': 3700 },
        { 'name': 'Novembro', 'value': 5100 },
        { 'name': 'Dezembro', 'value': 5200 }
    ];

    gradient: boolean = true;
    legendPosition = LegendPosition;

    colorScheme: Color = {
        domain: ['#5B8EEA', '#F4A600', '#64D78A', '#E35C5C'],
        name: 'testando',
        selectable: false,
        group: ScaleType.Time
    };

    onSelect(data: any): void {
        console.log('Item clicked', JSON.parse(JSON.stringify(data)));
    }

    onActivate(data: any): void {
        console.log('Activate', JSON.parse(JSON.stringify(data)));
    }

    onDeactivate(data: any): void {
        console.log('Deactivate', JSON.parse(JSON.stringify(data)));
    }
}
