import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { finalize } from 'rxjs';
import { AuthStore } from '../auth-store';
import { LoginApiClient } from '../login-api-client';

/**
 * Pantalla de inicio de sesión (`/login`).
 *
 * Formulario reactivo con documento y clave. Al autenticarse guarda la sesión
 * en {@link AuthStore} y navega a `/turnos`. Muestra mensajes distintos para
 * credenciales inválidas (`401`) y para otros errores.
 */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  /** Cliente del endpoint de login. */
  private readonly api = inject(LoginApiClient);
  /** Almacén de la sesión. */
  private readonly auth = inject(AuthStore);
  /** Enrutador, para navegar a `/turnos` tras autenticarse. */
  private readonly router = inject(Router);

  /** Formulario con los controles `documento` y `clave`, ambos obligatorios. */
  readonly form = new FormGroup({
    documento: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    clave: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  /** `true` mientras la solicitud de login está en curso; deshabilita el botón. */
  readonly busy = signal(false);
  /** Mensaje de error a mostrar; cadena vacía si no hay error. */
  readonly error = signal('');

  /**
   * Envía las credenciales al backend.
   *
   * Si el formulario es inválido marca los campos como tocados y muestra un
   * mensaje. Si la respuesta es válida guarda la sesión y navega a `/turnos`.
   */
  iniciarSesion(): void {
    if (this.busy()) return;
    this.error.set('');
    const { documento, clave } = this.form.getRawValue();
    if (this.form.invalid || !documento.trim()) {
      this.form.markAllAsTouched();
      this.error.set('Completa el documento y la clave.');
      return;
    }

    this.busy.set(true);
    this.api
      .login(documento.trim(), clave)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (response) => {
          if (!response || !this.auth.guardarSesion(response.accessToken, response.user)) {
            this.error.set('No se pudo iniciar sesión. Inténtalo nuevamente.');
            return;
          }
          this.router.navigateByUrl('/turnos');
        },
        error: (error: HttpErrorResponse) => {
          this.error.set(
            error.status === 401
              ? 'Documento o clave inválidos.'
              : 'No se pudo iniciar sesión. Inténtalo nuevamente.',
          );
        },
      });
  }
}
