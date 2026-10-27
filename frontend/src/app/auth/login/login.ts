import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { finalize } from 'rxjs';
import { AuthStore } from '../auth-store';
import { LoginApiClient } from '../login-api-client';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly api = inject(LoginApiClient);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  readonly form = new FormGroup({
    documento: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    clave: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  readonly busy = signal(false);
  readonly error = signal('');

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
    this.api.login(documento.trim(), clave).pipe(
      finalize(() => this.busy.set(false)),
    ).subscribe({
      next: (response) => {
        if (!response || !this.auth.guardarSesion(response.accessToken, response.user)) {
          this.error.set('No se pudo iniciar sesión. Inténtalo nuevamente.');
          return;
        }
        this.router.navigateByUrl('/turnos');
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(error.status === 401
          ? 'Documento o clave inválidos.'
          : 'No se pudo iniciar sesión. Inténtalo nuevamente.');
      },
    });
  }
}
