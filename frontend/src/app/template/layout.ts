import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStore } from '../auth/auth-store';
import { ROLE_LABELS } from '../auth/auth-user';

/**
 * Plantilla de las pantallas autenticadas.
 *
 * Muestra el encabezado con el email y el rol del usuario, el botón de cerrar
 * sesión y la navegación principal, cuyos enlaces dependen del rol:
 * - Todos: `/turnos` ("Mis turnos" para el médico, "Reservas" para el resto).
 * - `PACIENTE` y `ADMINISTRADOR`: `/reservar-turno`.
 * - `ADMINISTRADOR`: `/medicos` (valores de consulta).
 *
 * El contenido de la ruta hija se renderiza en el `<router-outlet>`.
 */
@Component({
  selector: 'app-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  /** Almacén de la sesión. */
  private readonly auth = inject(AuthStore);
  /** Usuario de la sesión actual (se lee una vez al crear el componente). */
  readonly usuario = this.auth.obtenerUsuario();
  /** Etiqueta legible del rol del usuario, para el encabezado. */
  readonly rol = this.usuario ? ROLE_LABELS[this.usuario.role] : '';

  /** Cierra la sesión y vuelve al login. */
  cerrarSesion(): void {
    this.auth.cerrarSesion();
  }
}
