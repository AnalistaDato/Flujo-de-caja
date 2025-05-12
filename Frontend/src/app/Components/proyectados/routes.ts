import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./proyectados.component').then(m => m.ProyectadosComponent),
    data: {
      title:'Proyectado'
    }
  }
];
