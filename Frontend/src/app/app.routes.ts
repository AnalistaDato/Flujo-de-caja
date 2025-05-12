import { Routes } from '@angular/router';
import { DefaultLayoutComponent } from './layout';
import { authGuard } from './guards/auth.guard'


export const routes: Routes = [
  {
    path: '',
    redirectTo: '/calendario',
    pathMatch: 'full'
  },
  {
    path: '',
    component: DefaultLayoutComponent,
    data: {
      title: 'Inicio'
    },
    canActivate: [authGuard],
    children: [
      {
        path: 'calendario',
        loadChildren: () => import('./Components/calendar/routes').then((m) => m.routes),
        canActivate: [authGuard],
        data: {rol:['Admin','Gerente','Contador','Controller']}
      },
      {
        path: 'tabla',
        loadChildren: () => import('./Components/tables/routes').then((m) => m.routes),
        canActivate: [authGuard],
        data: {rol:['Admin','Gerente','Contador','Controller']}
      },
      {
        path: 'facturas',
        loadChildren: () => import('./Components/facturas/routes').then((m) => m.routes),
        canActivate: [authGuard],
        data: {rol:['Admin','Gerente','Contador','Controller']}
      },
      {
        path: 'flujo_de_caja',
        loadChildren: () => import('./Components/flujo-de-caja/routes').then((m) => m.routes),
        canActivate: [authGuard],
        data: {rol:['Admin','Gerente','Contador','Controller','Prueba']}
      },
      {
        path: 'extracto',
        loadChildren: () => import('./Components/extracto/routes').then((m) => m.routes),
        canActivate: [authGuard],
        data: {rol:['Admin','Contador']}
      },
      {
        path: 'usuarios',
        loadChildren: () => import('./Components/users/routes').then((m) => m.routes),
        canActivate: [authGuard],
        data: {rol:['Admin','Gerente']}
      },
      {
        path: 'unauthorized',
        loadChildren: () => import('./Components/unauthorized/routes').then((m) => m.routes),
        canActivate: [authGuard],
        data: {rol:['Admin','Gerente','Contador','Controller','Prueba']}
      },
      {
        path: 'notificacion',
        loadChildren: () => import('./Components/notificacion/routes').then((m) => m.routes),
        canActivate: [authGuard],
        data: {rol:['Admin','Gerente','Contador','Controller','Prueba']}
      }, 
      {
        path: 'proyectaods',
        loadChildren: () => import('./Components/proyectados/routes').then((m) => m.routes),
        canActivate: [authGuard],
        data: {rol:['Admin','Gerente','Contador','Controller','Prueba']}
      }
    ]
  },
  {
    path: 'register',
    loadChildren: () => import('./Components/register/routes').then((m) => m.routes),
  },
  {
    path: 'forgot-password',
    loadChildren: () => import('./Components/forgot/routes').then((m) => m.routes)
  },
  {
    path: 'reset-password',
    loadChildren: () => import('./Components/reset/routes').then((m) => m.routes)
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
