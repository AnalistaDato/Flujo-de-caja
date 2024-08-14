import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../register/register.component').then(m => m.RegisterComponent),
    data: {
      title:'Registro'
    }
  }
];
