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
import { HorarioDisponible, Medico, NewReservationClient } from './new-reservation-client';

@Component({
  selector: 'app-new-reservation',
  imports: [FormsModule, RouterLink, ButtonModule, InputTextModule, SelectModule, ToastModule],
  providers: [MessageService],
  templateUrl: './new-reservation.html',
  styleUrl: './new-reservation.css',
})
export class NewReservation implements OnDestroy {
  private readonly client = inject(NewReservationClient);
  private readonly mensajes = inject(MessageService);
  private consultaHorarios?: Subscription;
  readonly esPaciente = inject(AuthStore).obtenerRol() === 'PACIENTE';
  readonly medicos = signal<Medico[]>([]);
  readonly horarios = signal<HorarioDisponible[]>([]);
  readonly cargandoMedicos = signal(false);
  readonly cargandoHorarios = signal(false);
  readonly enviando = signal(false);
  readonly error = signal('');
  medicoId: number | null = null;
  horario = '';
  readonly fechaMinima = this.fechaEnArgentina(new Date());
  readonly fechaMaxima = this.sumarDias(this.fechaMinima, 30);
  fecha = this.sumarDias(this.fechaMinima, 1);

  constructor() {
    if (!this.esPaciente) return;
    this.cargandoMedicos.set(true);
    this.client
      .obtenerMedicos()
      .pipe(finalize(() => this.cargandoMedicos.set(false)))
      .subscribe({
        next: (medicos) => this.medicos.set(medicos),
        error: () => this.error.set('No se pudieron cargar los médicos.'),
      });
  }

  ngOnDestroy(): void {
    this.consultaHorarios?.unsubscribe();
  }

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

  confirmar(): void {
    if (
      !this.esPaciente ||
      this.enviando() ||
      !this.medicoId ||
      !this.horarios().some((item) => item.dateTime === this.horario)
    )
      return;
    this.enviando.set(true);
    this.error.set('');
    this.client
      .crearReserva(this.medicoId, this.horario)
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

  opcionesMedicos() {
    return this.medicos().map((medico) => ({
      label: `${medico.nombres} ${medico.apellidos}`,
      value: medico.id,
    }));
  }

  opcionesHorarios() {
    return this.horarios().map((horario) => ({
      label: this.hora(horario.dateTime),
      value: horario.dateTime,
    }));
  }

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

  hora(dateTime: string): string {
    return new Intl.DateTimeFormat('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(dateTime));
  }

  private fechaEnArgentina(fecha: Date): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(fecha);
  }

  private sumarDias(fecha: string, dias: number): string {
    const resultado = new Date(`${fecha}T12:00:00Z`);
    resultado.setUTCDate(resultado.getUTCDate() + dias);
    return resultado.toISOString().slice(0, 10);
  }
}
