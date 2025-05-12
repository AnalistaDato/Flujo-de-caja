import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./forgot.component').then(m => m.ForgotComponent),
    data: {
      title: `Forgot`
    }
  }
];
