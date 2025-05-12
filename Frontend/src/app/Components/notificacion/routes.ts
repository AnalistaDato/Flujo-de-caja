import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./notificacion.component').then(m => m.NotificacionComponent),
    data: {
      title: `Notificación`
    }
  }
];
