import { Routes } from '@angular/router';

export const routes: Routes = [
    {
      path: '',
      loadComponent: () => import('../facturas/facturas.component').then(m => m.FacturasComponent),
      data: {
        title:'Facturas'
      }
    }
  ];
  