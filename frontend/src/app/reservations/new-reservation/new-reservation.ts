import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { finalize, Subscription } from 'rxjs';
import { AuthStore } from '../../auth/auth-store';
import {
  HorarioDisponible,
  Medico,
  NewReservationClient,
  Paciente,
} from './new-reservation-client';

/**
 * Pantalla de nueva reserva (`/reservar-turno`), para `PACIENTE` y
 * `ADMINISTRADOR`.
 *
 * Flujo: (administrador: elegir paciente) → elegir médico → elegir fecha,
 * entre hoy y 30 días → elegir uno de los horarios libres devueltos por el
 * backend → confirmar. Muestra el valor de consulta del médico elegido. Si el
 * horario se ocupa entre la consulta y la confirmación (`409`), recarga los
 * horarios y avisa.
 */
@Component({
  selector: 'app-new-reservation',
  imports: [FormsModule, RouterLink, ButtonModule, InputTextModule, SelectModule, ToastModule],
  providers: [MessageService],
  templateUrl: './new-reservation.html',
  styleUrl: './new-reservation.css',
})
export class NewReservation implements OnDestroy {
  /** Cliente HTTP de la pantalla. */
  private readonly client = inject(NewReservationClient);
  /** Servicio de toasts de PrimeNG. */
  private readonly mensajes = inject(MessageService);
  /** Suscripción de la consulta de horarios en curso, para cancelarla si cambian médico o fecha. */
  private consultaHorarios?: Subscription;
  /** Rol del usuario autenticado. */
  private readonly rol = inject(AuthStore).obtenerRol();
  /** `true` si el usuario es paciente (reserva para sí mismo). */
  readonly esPaciente = this.rol === 'PACIENTE';
  /** `true` si el usuario es administrador (debe elegir paciente). */
  readonly esAdmin = this.rol === 'ADMINISTRADOR';
  /** Pacientes activos (sólo administrador). */
  readonly pacientes = signal<Paciente[]>([]);
  /** `true` mientras se cargan los pacientes. */
  readonly cargandoPacientes = signal(false);
  /** Mensaje de error de la carga de pacientes. */
  readonly errorPacientes = signal('');
  /** Paciente elegido por el administrador. */
  pacienteId: number | null = null;
  /** Médicos activos. */
  readonly medicos = signal<Medico[]>([]);
  /** Horarios libres del médico y fecha elegidos. */
  readonly horarios = signal<HorarioDisponible[]>([]);
  /** `true` mientras se cargan los médicos. */
  readonly cargandoMedicos = signal(false);
  /** `true` mientras se cargan los horarios. */
  readonly cargandoHorarios = signal(false);
  /** `true` mientras se envía la reserva. */
  readonly enviando = signal(false);
  /** Mensaje de error general; cadena vacía si no hay error. */
  readonly error = signal('');
  /** Médico elegido. */
  medicoId: number | null = null;
  /** Horario elegido (`dateTime` de la disponibilidad); cadena vacía si ninguno. */
  horario = '';
  /** Fecha mínima seleccionable: hoy en Argentina. */
  readonly fechaMinima = this.fechaEnArgentina(new Date());
  /** Fecha máxima seleccionable: 30 días después de hoy. */
  readonly fechaMaxima = this.sumarDias(this.fechaMinima, 30);
  /** Fecha elegida; por defecto mañana. */
  fecha = this.sumarDias(this.fechaMinima, 1);

  /** Carga médicos y, para el administrador, pacientes. No hace nada para otros roles. */
  constructor() {
    if (!this.esPaciente && !this.esAdmin) return;
    if (this.esAdmin) {
      this.cargandoPacientes.set(true);
      this.client
        .obtenerPacientes()
        .pipe(finalize(() => this.cargandoPacientes.set(false)))
        .subscribe({
          next: (pacientes) => this.pacientes.set(pacientes),
          error: () => this.errorPacientes.set('No se pudieron cargar los pacientes.'),
        });
    }
    this.cargandoMedicos.set(true);
    this.client
      .obtenerMedicos()
      .pipe(finalize(() => this.cargandoMedicos.set(false)))
      .subscribe({
        next: (medicos) => this.medicos.set(medicos),
        error: () => this.error.set('No se pudieron cargar los médicos.'),
      });
  }

  /** Cancela la consulta de horarios pendiente. */
  ngOnDestroy(): void {
    this.consultaHorarios?.unsubscribe();
  }

  /**
   * Consulta los horarios libres para el médico y la fecha elegidos.
   *
   * Limpia el horario seleccionado y la lista anterior. No consulta si falta
   * el médico o la fecha está fuera del rango permitido.
   */
  cargarHorarios(): void {
    this.consultaHorarios?.unsubscribe();
    this.horario = '';
    this.horarios.set([]);
    this.error.set('');
    if (
      !this.medicoId ||
      !this.fecha ||
      this.fecha < this.fechaMinima ||
      this.fecha > this.fechaMaxima
    )
      return;

    this.cargandoHorarios.set(true);
    this.consultaHorarios = this.client
      .obtenerHorarios(this.medicoId, this.fecha)
      .pipe(finalize(() => this.cargandoHorarios.set(false)))
      .subscribe({
        next: (horarios) => this.horarios.set(horarios),
        error: () => this.error.set('No se pudieron cargar los horarios disponibles.'),
      });
  }

  /**
   * Envía la reserva al backend.
   *
   * Requiere un rol válido, médico y horario elegidos de la lista actual y,
   * para el administrador, un paciente de la lista. Tras crearla muestra un
   * toast y recarga los horarios. Si el backend responde `409`, recarga los
   * horarios y pide elegir otro.
   */
  confirmar(): void {
    if (
      (!this.esPaciente && !this.esAdmin) ||
      (this.esAdmin && !this.pacientes().some((paciente) => paciente.id === this.pacienteId)) ||
      this.enviando() ||
      !this.medicoId ||
      !this.horarios().some((item) => item.dateTime === this.horario)
    )
      return;
    this.enviando.set(true);
    this.error.set('');
    this.client
      .crearReserva(this.medicoId, this.horario, this.esAdmin ? this.pacienteId! : undefined)
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: () => {
          this.mensajes.add({
            severity: 'success',
            summary: 'Reserva',
            detail: 'Reserva creada correctamente.',
          });
          this.cargarHorarios();
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 409) {
            this.cargarHorarios();
            this.error.set('El horario seleccionado ya está ocupado. Elige otro horario.');
          } else {
            this.error.set('No se pudo crear la reserva.');
          }
        },
      });
  }

  /** Opciones del selector de paciente: `Nombre Apellido · documento`. */
  opcionesPacientes() {
    return this.pacientes().map((paciente) => ({
      label: `${paciente.firstName} ${paciente.lastName} · ${paciente.document}`,
      value: paciente.id,
    }));
  }

  /** Opciones del selector de médico: nombre completo. */
  opcionesMedicos() {
    return this.medicos().map((medico) => ({
      label: `${medico.nombres} ${medico.apellidos}`,
      value: medico.id,
    }));
  }

  /** Opciones del selector de horario: hora `HH:mm` de cada turno libre. */
  opcionesHorarios() {
    return this.horarios().map((horario) => ({
      label: this.hora(horario.dateTime),
      value: horario.dateTime,
    }));
  }

  /**
   * Valor de consulta del médico elegido, formateado como moneda argentina;
   * `—` si no hay médico elegido.
   */
  valorConsulta(): string {
    const valor = this.medicos().find((medico) => medico.id === this.medicoId)?.valor_consulta;
    return valor === undefined
      ? '—'
      : new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS',
          maximumFractionDigits: 0,
        }).format(valor);
  }

  /**
   * Hora `HH:mm` de un instante, en hora de Argentina.
   *
   * @param dateTime Instante ISO 8601.
   */
  hora(dateTime: string): string {
    return new Intl.DateTimeFormat('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(dateTime));
  }

  /**
   * Fecha `YYYY-MM-DD` de un instante, en hora de Argentina.
   *
   * @param fecha Instante a convertir.
   */
  private fechaEnArgentina(fecha: Date): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(fecha);
  }

  /**
   * Suma días de calendario a una fecha `YYYY-MM-DD` sin efectos de zona horaria.
   *
   * @param fecha Fecha base.
   * @param dias Días a sumar.
   */
  private sumarDias(fecha: string, dias: number): string {
    const resultado = new Date(`${fecha}T12:00:00Z`);
    resultado.setUTCDate(resultado.getUTCDate() + dias);
    return resultado.toISOString().slice(0, 10);
  }
}
