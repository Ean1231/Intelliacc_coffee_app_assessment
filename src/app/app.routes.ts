import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage)
  },
  {
    path: 'flavours',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/flavours/flavours.page').then((m) => m.FlavoursPage)
  },
  {
    path: 'manage-flavours/manage-flavours',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/manage-flavours/manage-flavour.page').then((m) => m.ManageFlavourPage)
  },
  {
    path: 'manage-flavours/manage-flavours/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/manage-flavours/manage-flavour.page').then((m) => m.ManageFlavourPage)
  },
];
