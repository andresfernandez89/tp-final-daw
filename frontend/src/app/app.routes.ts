import { Routes } from '@angular/router';
import { authGuard } from './auth/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login').then((m) => m.Login),
  },
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    loadComponent: () => import('./template/layout').then((m) => m.Layout),
    children: [
      {
        path: 'turnos',
        loadComponent: () => import('./reservations/reservations').then((m) => m.Reservations),
      },
      {
        path: 'reservar-turno',
        loadComponent: () =>
          import('./reservations/new-reservation/new-reservation').then((m) => m.NewReservation),
      },
      {
        path: 'medicos',
        loadComponent: () => import('./doctors/doctors').then((m) => m.Doctors),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./shared/not-found/not-found').then((m) => m.NotFound),
  },
];
