import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./tables.component').then(m => m.TablesComponent),
    data: {
      title: `Tabla`
    }
  }
];
