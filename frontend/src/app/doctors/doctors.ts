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

/** Valor de consulta máximo aceptado por el backend (límite de `integer` en PostgreSQL). */
const VALOR_MAXIMO = 2147483647;

/**
 * Pantalla de valores de consulta (`/medicos`), sólo para `ADMINISTRADOR`.
 *
 * Lista los médicos activos con su valor de consulta y permite modificarlo
 * desde un diálogo modal. Tras guardar, actualiza la fila en la tabla y
 * muestra un toast de confirmación o de error.
 */
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
  /** Cliente usado para obtener el listado de médicos. */
  private readonly reservationsClient = inject(ReservationsClient);
  /** Cliente de la actualización del valor de consulta. */
  private readonly doctorsClient = inject(DoctorsClient);
  /** Servicio de toasts de PrimeNG. */
  private readonly mensajes = inject(MessageService);

  /** Valor máximo del campo, expuesto a la plantilla. */
  readonly valorMaximo = VALOR_MAXIMO;
  /** Médicos activos listados. */
  readonly medicos = signal<Doctor[]>([]);
  /** `true` mientras se carga el listado inicial. */
  readonly cargando = signal(true);
  /** Mensaje de error del listado; cadena vacía si no hay error. */
  readonly error = signal('');
  /** Médico en edición; `null` cuando el diálogo está cerrado. */
  readonly seleccionado = signal<Doctor | null>(null);
  /** `true` mientras se guarda el nuevo valor; bloquea el diálogo. */
  readonly guardando = signal(false);
  /** Mensaje de error del formulario de edición. */
  readonly errorEdicion = signal('');
  /** Formulario del diálogo: `valorConsulta` obligatorio, entre 1 y {@link valorMaximo}. */
  readonly form = new FormGroup({
    valorConsulta: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(1),
      Validators.max(VALOR_MAXIMO),
    ]),
  });

  /** Carga el listado de médicos al crear el componente. */
  constructor() {
    this.reservationsClient
      .obtenerMedicos()
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (medicos) => this.medicos.set(medicos),
        error: () => this.error.set('No se pudieron obtener los valores de consulta.'),
      });
  }

  /**
   * Nombre completo del médico.
   *
   * @param medico Médico a mostrar.
   */
  nombreMedico(medico: Doctor): string {
    return `${medico.nombres} ${medico.apellidos}`;
  }

  /**
   * Formatea un importe como moneda argentina.
   *
   * @param amount Importe en pesos.
   */
  valor(amount: number): string {
    return formatearValor(amount);
  }

  /**
   * Abre el diálogo de edición con el valor actual del médico.
   *
   * @param medico Médico a editar.
   */
  abrirEdicion(medico: Doctor): void {
    this.errorEdicion.set('');
    this.form.reset({ valorConsulta: medico.valor_consulta });
    this.seleccionado.set(medico);
  }

  /** Cierra el diálogo de edición, salvo que haya un guardado en curso. */
  cerrarEdicion(): void {
    if (this.guardando()) return;
    this.seleccionado.set(null);
  }

  /**
   * Envía el nuevo valor de consulta al backend.
   *
   * Si el formulario es inválido muestra un mensaje. Si la actualización tiene
   * éxito reemplaza el médico en el listado, cierra el diálogo y muestra un
   * toast; si falla, muestra un toast de error y mantiene el diálogo abierto.
   */
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
