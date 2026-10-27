import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { catchError, finalize, forkJoin, of, switchMap } from 'rxjs';
import { AuthStore } from '../auth/auth-store';
import { Doctor, Patient, Reservation, ReservationsClient } from './reservations-client';

@Component({
  selector: 'app-reservations',
  imports: [FormsModule, ButtonModule, InputTextModule, SelectModule, TableModule],
  templateUrl: './reservations.html',
  styleUrl: './reservations.css',
})
export class Reservations {
  private readonly client = inject(ReservationsClient);
  private readonly rol = inject(AuthStore).obtenerRol();
  readonly esPaciente = this.rol === 'PACIENTE';
  readonly esAdmin = this.rol === 'ADMINISTRADOR';
  readonly reservas = signal<Reservation[]>([]);
  readonly medicos = signal<Doctor[]>([]);
  readonly pacientes = signal<Patient[]>([]);
  documento = '';
  estado = '';
  readonly estados = [
    { label: 'Todos los estados', value: '' },
    { label: 'Activo', value: 'ACTIVO' },
    { label: 'Atendido', value: 'ATENDIDO' },
    { label: 'Ausente', value: 'AUSENTE' },
    { label: 'Cancelado', value: 'CANCELADO' },
  ];
  readonly cargando = signal(false);
  readonly error = signal('');

  constructor() {
    if (this.esPaciente || this.esAdmin) this.cargarReservas();
  }

  cargarReservas(): void {
    if (this.cargando()) return;
    this.cargando.set(true);
    this.error.set('');
    const consulta = this.esAdmin
      ? this.client.obtenerReservasAdmin(this.estado, this.documento)
      : this.client.obtenerMisReservas();

    consulta
      .pipe(
        switchMap((reservas) => this.cargarDatosDeLasPersonas(reservas)),
        finalize(() => this.cargando.set(false)),
      )
      .subscribe({
        next: ({ reservas, medicos, pacientes }) => {
          this.reservas.set(reservas);
          this.medicos.set(medicos);
          this.pacientes.set(pacientes);
        },
        error: () => this.error.set('No se pudieron cargar las reservas.'),
      });
  }

  private cargarDatosDeLasPersonas(reservas: Reservation[]) {
    if (reservas.length === 0) {
      return of({ reservas, medicos: [], pacientes: [] });
    }

    const medicos = this.client.obtenerMedicos().pipe(catchError(() => of([])));
    const pacientes = this.esAdmin
      ? this.client.obtenerPacientes().pipe(catchError(() => of([])))
      : of([]);

    return forkJoin({ reservas: of(reservas), medicos, pacientes });
  }

  nombrePaciente(id: number): string {
    const paciente = this.pacientes().find((item) => item.id === id);
    return paciente ? `${paciente.firstName} ${paciente.lastName}` : `Paciente #${id}`;
  }

  documentoPaciente(id: number): string {
    return this.pacientes().find((paciente) => paciente.id === id)?.document ?? '—';
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
