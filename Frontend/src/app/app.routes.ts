import { Routes } from '@angular/router';
import { DefaultLayoutComponent } from './layout';
import { authGuard } from './guards/auth.guard'


export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: '',
    component: DefaultLayoutComponent,
    data: {
      title: 'Home'
    },
    
    children: [
      {
        path: 'calendario',
        loadChildren: () => import('./Components/calendar/routes').then((m) => m.routes),
        canActivate: [authGuard]
      },
      {
        path: 'tabla',
        loadChildren: () => import('./Components/tables/routes').then((m) => m.routes),
        canActivate: [authGuard]
      },
      {
        path: 'register',
        loadChildren: () => import('./Components/register/routes').then((m) => m.routes),
        canActivate: [authGuard]
      },
      {
        path: 'facturas',
        loadChildren: () => import('./Components/facturas/routes').then((m) => m.routes),
        canActivate: [authGuard]
      },
      {
        path: 'flujo_de_caja',
        loadChildren: () => import('./Components/flujo-de-caja/routes').then((m) => m.routes),
        canActivate: [authGuard]
      },
      {
        path: 'extracto',
        loadChildren: () => import('./Components/extracto/routes').then((m) => m.routes),
        canActivate: [authGuard]
      },
    ]
    ,
    canActivate: [authGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./Components/login/login.component').then(m => m.LoginComponent),
    data: {
      title: 'Login'
    }
  },
  {
    path: '**',
    redirectTo: ''
  }
];
