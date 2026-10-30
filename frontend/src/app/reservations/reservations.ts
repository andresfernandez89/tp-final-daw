import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Popover, PopoverModule } from 'primeng/popover';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { catchError, finalize, forkJoin, of, Subscription, switchMap } from 'rxjs';
import { AuthStore } from '../auth/auth-store';
import { formatearValor } from '../shared/formatters';
import {
  AgendaItem,
  Doctor,
  Patient,
  Reservation,
  ReservationsClient,
} from './reservations-client';

@Component({
  selector: 'app-reservations',
  imports: [
    PopoverModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    TableModule,
    ToastModule,
    TooltipModule,
  ],
  providers: [MessageService],
  templateUrl: './reservations.html',
  styleUrl: './reservations.css',
})
export class Reservations implements OnDestroy {
  private readonly client = inject(ReservationsClient);
  private readonly mensajes = inject(MessageService);
  private readonly ahora = signal(Date.now());
  private reloj?: ReturnType<typeof setInterval>;
  private readonly rol = inject(AuthStore).obtenerRol();
  readonly esPaciente = this.rol === 'PACIENTE';
  readonly esAdmin = this.rol === 'ADMINISTRADOR';
  readonly esMedico = this.rol === 'MEDICO';
  readonly agenda = signal<AgendaItem[]>([]);
  fechaAgenda = Reservations.hoyEnArgentina();
  private consultaAgenda?: Subscription;
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
  readonly cancelando = signal(false);
  readonly marcando = signal(false);
  mostrarConfirmacion = false;
  reservaSeleccionada?: Reservation;

  constructor() {
    if (this.esPaciente || this.esAdmin) {
      this.cargarReservas();
    } else if (this.esMedico) {
      this.cargarAgenda();
    }
    this.reloj = setInterval(() => this.ahora.set(Date.now()), 1000);
  }

  /** Fecha de hoy en formato YYYY-MM-DD según la zona horaria de la clínica. */
  private static hoyEnArgentina(): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }

  ngOnDestroy(): void {
    this.consultaAgenda?.unsubscribe();
    clearInterval(this.reloj);
  }

  abrirCalendario(input: HTMLInputElement): void {
    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
      } catch {
        input.focus();
      }
    }
  }

  cargarAgenda(): void {
    this.consultaAgenda?.unsubscribe();
    this.agenda.set([]);
    this.error.set('');
    if (!this.fechaAgenda) return;

    this.cargando.set(true);
    this.consultaAgenda = this.client
      .obtenerAgenda(this.fechaAgenda)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (agenda) => this.agenda.set(agenda),
        error: () => this.error.set('No se pudieron cargar los turnos.'),
      });
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

  puedeCancelar(reserva: Reservation): boolean {
    if (reserva.state !== 'ACTIVO' || (!this.esPaciente && !this.esAdmin)) return false;
    const inicio = new Date(reserva.dateTime);
    if (Number.isNaN(inicio.getTime())) return false;
    const ahora = new Date(this.ahora());
    if (this.esAdmin) return ahora.getTime() < inicio.getTime();

    const fechaArgentina = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return fechaArgentina.format(ahora) < fechaArgentina.format(inicio);
  }

  solicitarCancelacion(reserva: Reservation): void {
    this.ahora.set(Date.now());
    if (!this.puedeCancelar(reserva)) return;
    this.reservaSeleccionada = reserva;
    this.mostrarConfirmacion = true;
  }

  cancelarReserva(): void {
    if (!this.reservaSeleccionada || this.cancelando()) return;
    this.ahora.set(Date.now());
    if (!this.puedeCancelar(this.reservaSeleccionada)) {
      this.mostrarConfirmacion = false;
      this.mensajes.add({
        severity: 'error',
        summary: 'Cancelación',
        detail: 'El plazo para cancelar venció.',
      });
      return;
    }

    this.cancelando.set(true);
    this.client
      .cancelarReserva(this.reservaSeleccionada.id)
      .pipe(finalize(() => this.cancelando.set(false)))
      .subscribe({
        next: (reserva) => {
          this.reservas.update((reservas) =>
            reservas.map((item) => (item.id === reserva.id ? reserva : item)),
          );
          this.mostrarConfirmacion = false;
          this.mensajes.add({
            severity: 'success',
            summary: 'Cancelación',
            detail: 'La reserva se canceló correctamente.',
          });
          this.cargarReservas();
        },
        error: () => {
          this.mostrarConfirmacion = false;
          this.mensajes.add({
            severity: 'error',
            summary: 'Cancelación',
            detail: 'No se pudo cancelar la reserva.',
          });
        },
      });
  }

  /** El médico puede registrar la atención desde el inicio de la consulta (inclusive). */
  yaEmpezo(reserva: AgendaItem): boolean {
    const inicio = new Date(reserva.dateTime);
    if (Number.isNaN(inicio.getTime())) return false;
    return this.ahora() >= inicio.getTime();
  }

  private readonly accionesAtencion = [
    { label: 'Atendido', hint: 'El paciente asistió a la consulta', value: 'ATENDIDO' as const },
    { label: 'Ausente', hint: 'El paciente no se presentó', value: 'AUSENTE' as const },
  ];
  reservaEnMenu?: AgendaItem;
  menuAbierto = false;

  /** Opciones del menú "Marcar como": todas menos el estado actual del turno. */
  opcionesAtencion(reserva?: AgendaItem) {
    if (!reserva) return [];
    return this.accionesAtencion.filter((accion) => accion.value !== reserva.state);
  }

  abrirMenu(event: Event, reserva: AgendaItem, menu: Popover): void {
    if (this.reservaEnMenu?.id === reserva.id && this.menuAbierto) {
      menu.hide();
      return;
    }
    this.reservaEnMenu = reserva;
    menu.hide();
    menu.show(event);
  }

  elegirAccion(estado: 'ATENDIDO' | 'AUSENTE', menu: Popover): void {
    const reserva = this.reservaEnMenu;
    menu.hide();
    if (!reserva) return;
    this.marcarAtencion(reserva, estado);
  }

  puedeMarcar(reserva: AgendaItem, estado: 'ATENDIDO' | 'AUSENTE'): boolean {
    if (!this.esMedico || reserva.state === estado) return false;
    if (reserva.state === 'CANCELADO') return false;
    return this.yaEmpezo(reserva);
  }

  marcarAtencion(reserva: AgendaItem, estado: 'ATENDIDO' | 'AUSENTE'): void {
    if (this.marcando()) return;
    this.ahora.set(Date.now());
    if (!this.puedeMarcar(reserva, estado)) {
      this.mensajes.add({
        severity: 'error',
        summary: 'Atención',
        detail: 'La atención sólo se puede registrar desde el inicio de la consulta.',
      });
      return;
    }

    const etiqueta = estado === 'ATENDIDO' ? 'atendido' : 'ausente';
    this.marcando.set(true);
    this.client
      .marcarAtencion(reserva.id, estado)
      .pipe(finalize(() => this.marcando.set(false)))
      .subscribe({
        next: (actualizada) => {
          this.agenda.update((agenda) =>
            agenda.map((item) =>
              item.id === actualizada.id ? { ...item, state: actualizada.state } : item,
            ),
          );
          this.mensajes.add({
            severity: 'success',
            summary: 'Atención',
            detail: `El turno se marcó como ${etiqueta}.`,
          });
        },
        error: (err: HttpErrorResponse) => {
          const detalle = err.error?.message;
          this.mensajes.add({
            severity: 'error',
            summary: 'Atención',
            detail:
              typeof detalle === 'string'
                ? detalle
                : `No se pudo marcar el turno como ${etiqueta}.`,
          });
          this.cargarAgenda();
        },
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
    return formatearValor(amount);
  }
}
