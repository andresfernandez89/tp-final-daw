import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStore } from '../auth/auth-store';
import { ROLE_LABELS } from '../auth/auth-user';

@Component({
  selector: 'app-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  private readonly auth = inject(AuthStore);
  readonly usuario = this.auth.obtenerUsuario();
  readonly rol = this.usuario ? ROLE_LABELS[this.usuario.role] : '';

  cerrarSesion(): void {
    this.auth.cerrarSesion();
  }
}
