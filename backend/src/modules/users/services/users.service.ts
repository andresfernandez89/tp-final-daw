import { Injectable } from '@nestjs/common';

/**
 * Servicio de usuarios.
 *
 * Aún sin operaciones; reservado para la lógica de administración de
 * usuarios. El acceso actual a la tabla `usuarios` lo hacen directamente
 * {@link AuthService}, {@link PatientsService} y {@link ReservationsService}.
 */
@Injectable()
export class UsersService {}
