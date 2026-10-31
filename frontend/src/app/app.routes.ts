import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './auth/auth-guard';

/**
 * Rutas de la aplicación. Todas las pantallas se cargan de forma diferida
 * (`loadComponent`).
 *
 * | Ruta              | Componente       | Acceso                                   |
 * | ----------------- | ---------------- | ---------------------------------------- |
 * | `/login`          | `Login`          | Público                                  |
 * | `/turnos`         | `Reservations`   | Autenticado (cualquier rol)              |
 * | `/reservar-turno` | `NewReservation` | Autenticado (la pantalla valida el rol)  |
 * | `/medicos`        | `Doctors`        | Autenticado con rol `ADMINISTRADOR`      |
 * | `**`              | `NotFound`       | Público                                  |
 *
 * Las rutas protegidas son hijas del {@link Layout}, que aplica
 * {@link authGuard} en `canActivate` y `canActivateChild`. La raíz redirige a
 * `/login`.
 */
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
        canActivate: [roleGuard('ADMINISTRADOR')],
        loadComponent: () => import('./doctors/doctors').then((m) => m.Doctors),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./shared/not-found/not-found').then((m) => m.NotFound),
  },
];
