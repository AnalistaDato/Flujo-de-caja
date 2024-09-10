import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./extracto.component').then(m => m.ExtractoComponent),
    data: {
      title: `Extracto`
    }
  }
];
