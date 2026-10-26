import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login').then((m) => m.Login),
  },
  {
    path: 'turnos',
    loadComponent: () => import('./reservations/reservations').then((m) => m.Reservations),
  },
  {
    path: 'medicos',
    loadComponent: () => import('./doctors/doctors').then((m) => m.Doctors),
  },
  {
    path: '**',
    loadComponent: () => import('./shared/not-found/not-found').then((m) => m.NotFound),
  },
];
