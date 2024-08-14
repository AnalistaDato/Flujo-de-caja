import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../calendar/calendar.component').then(m => m.CalendarComponent),
    data: {
      title:'Calendario'
    }
  }
];
