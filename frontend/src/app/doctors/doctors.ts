import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { finalize } from 'rxjs';
import { Doctor, ReservationsClient } from '../reservations/reservations-client';
import { formatearValor } from '../shared/formatters';
import { DoctorsClient } from './doctors-client';

const VALOR_MAXIMO = 2147483647;

@Component({
  selector: 'app-doctors',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputNumberModule,
    TableModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './doctors.html',
  styleUrl: './doctors.css',
})
export class Doctors {
  private readonly reservationsClient = inject(ReservationsClient);
  private readonly doctorsClient = inject(DoctorsClient);
  private readonly mensajes = inject(MessageService);

  readonly valorMaximo = VALOR_MAXIMO;
  readonly medicos = signal<Doctor[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly seleccionado = signal<Doctor | null>(null);
  readonly guardando = signal(false);
  readonly errorEdicion = signal('');
  readonly form = new FormGroup({
    valorConsulta: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(1),
      Validators.max(VALOR_MAXIMO),
    ]),
  });

  constructor() {
    this.reservationsClient
      .obtenerMedicos()
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (medicos) => this.medicos.set(medicos),
        error: () => this.error.set('No se pudieron obtener los valores de consulta.'),
      });
  }

  nombreMedico(medico: Doctor): string {
    return `${medico.nombres} ${medico.apellidos}`;
  }

  valor(amount: number): string {
    return formatearValor(amount);
  }

  abrirEdicion(medico: Doctor): void {
    this.errorEdicion.set('');
    this.form.reset({ valorConsulta: medico.valor_consulta });
    this.seleccionado.set(medico);
  }

  cerrarEdicion(): void {
    if (this.guardando()) return;
    this.seleccionado.set(null);
  }

  guardar(): void {
    const medico = this.seleccionado();
    if (!medico || this.guardando()) return;
    const valor = this.form.controls.valorConsulta.value;
    if (this.form.invalid || valor === null) {
      this.form.markAllAsTouched();
      this.errorEdicion.set('Ingresa un valor entero mayor a cero.');
      return;
    }

    this.errorEdicion.set('');
    this.guardando.set(true);
    this.doctorsClient
      .actualizarValorConsulta(medico.id, valor)
      .pipe(finalize(() => this.guardando.set(false)))
      .subscribe({
        next: (actualizado) => {
          this.medicos.update((medicos) =>
            medicos.map((item) => (item.id === actualizado.id ? actualizado : item)),
          );
          this.seleccionado.set(null);
          this.mensajes.add({
            severity: 'success',
            summary: 'Valor de consulta',
            detail: 'El valor de consulta se actualizó correctamente.',
          });
        },
        error: () =>
          this.mensajes.add({
            severity: 'error',
            summary: 'Valor de consulta',
            detail: 'No se pudo actualizar el valor de consulta.',
          }),
      });
  }
}
