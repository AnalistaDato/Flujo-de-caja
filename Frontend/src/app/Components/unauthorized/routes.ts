import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./unauthorized.component').then(m => m.UnauthorizedComponent),
    data: {
      title: `Sin autorización`
    }
  }
];
