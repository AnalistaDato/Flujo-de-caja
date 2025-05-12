import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: ':token',
    loadComponent: () => import('./reset.component').then(m => m.ResetComponent),
    data: {
      title: `reset-password`
    }
  }
];
