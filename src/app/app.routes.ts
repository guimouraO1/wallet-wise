import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'sign-in',
        pathMatch: 'full'
    },
    {
        title: 'Wallet Wise - Sign-In',
        path: 'sign-in',
        loadComponent: () => import('./pages/sign-in/sign-in.component').then((m) => m.SignInComponent)
    },
    {
        path: '',
        canActivateChild: [authGuard],
        loadComponent: () => import('./pages/layout-auth/layout-auth.component').then((m) => m.LayoutAuthComponent),
        children: [
            {
                title: 'Wallet Wise - Home',
                path: 'home',
                loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent)
            },
            {
                title: 'Wallet Wise - Transactions',
                path: 'transactions',
                loadComponent: () => import('./pages/transactions/transactions.component').then((m) => m.TransactionsComponent)
            }
        ]
    }
];
