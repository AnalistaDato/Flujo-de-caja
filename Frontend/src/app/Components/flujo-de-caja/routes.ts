import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../flujo-de-caja/flujo-de-caja.component').then(m => m.FlujoDeCajaComponent),
    data: {
      title:'Flujo de caja'
    }
  }
];