import { Component, inject, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { AuthStore } from '../auth/auth-store';
import { Doctor, Reservation, ReservationsClient } from './reservations-client';

@Component({
  selector: 'app-reservations',
  imports: [TableModule],
  templateUrl: './reservations.html',
  styleUrl: './reservations.css',
})
export class Reservations {
  private readonly client = inject(ReservationsClient);
  readonly esPaciente = inject(AuthStore).obtenerRol() === 'PACIENTE';
  readonly reservas = signal<Reservation[]>([]);
  readonly medicos = signal<Doctor[]>([]);
  readonly cargando = signal(false);
  readonly error = signal('');

  constructor() {
    if (this.esPaciente) this.cargarReservas();
  }

  cargarReservas(): void {
    this.cargando.set(true);
    this.error.set('');
    this.client.obtenerMisReservas().subscribe({
      next: (reservas) => {
        this.reservas.set(reservas);
        if (reservas.length === 0) {
          this.cargando.set(false);
          return;
        }
        this.client.obtenerMedicos().subscribe({
          next: (medicos) => {
            this.medicos.set(medicos);
            this.cargando.set(false);
          },
          error: () => {
            this.medicos.set([]);
            this.cargando.set(false);
          },
        });
      },
      error: () => {
        this.error.set('No se pudieron cargar las reservas.');
        this.cargando.set(false);
      },
    });
  }

  nombreMedico(id: number): string {
    const medico = this.medicos().find((item) => item.id === id);
    return medico ? `${medico.nombres} ${medico.apellidos}` : `Médico #${id}`;
  }

  fecha(dateTime: string): string {
    return new Intl.DateTimeFormat('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateTime));
  }

  hora(dateTime: string): string {
    return new Intl.DateTimeFormat('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(dateTime));
  }

  valor(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(amount);
  }
}
