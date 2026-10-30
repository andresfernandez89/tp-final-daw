import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Componente raíz de la aplicación.
 *
 * Sólo contiene un `<router-outlet>`: el enrutador decide si se muestra la
 * pantalla de inicio de sesión o el {@link Layout} con las pantallas
 * protegidas.
 */
@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
