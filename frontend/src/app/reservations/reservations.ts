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

/**
 * Pantalla de turnos (`/turnos`). Su contenido depende del rol:
 *
 * - **PACIENTE** ("Mis reservas"): lista sus reservas y permite cancelarlas
 *   hasta el día anterior al turno.
 * - **ADMINISTRADOR** ("Reservas"): lista todas las reservas con filtros por
 *   documento y estado, y permite cancelarlas hasta el inicio del turno.
 * - **MEDICO** ("Mis turnos"): muestra la agenda de una fecha y permite
 *   marcar cada turno como `ATENDIDO` o `AUSENTE` desde su inicio.
 *
 * Un reloj interno se actualiza cada segundo para habilitar o deshabilitar
 * las acciones según el plazo, replicando las reglas del backend.
 */
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
  /** Cliente HTTP de reservas. */
  private readonly client = inject(ReservationsClient);
  /** Servicio de toasts de PrimeNG. */
  private readonly mensajes = inject(MessageService);
  /** Instante actual (ms), actualizado cada segundo para evaluar plazos. */
  private readonly ahora = signal(Date.now());
  /** Temporizador que actualiza {@link ahora}. */
  private reloj?: ReturnType<typeof setInterval>;
  /** Rol del usuario autenticado. */
  private readonly rol = inject(AuthStore).obtenerRol();
  /** `true` si el usuario es paciente. */
  readonly esPaciente = this.rol === 'PACIENTE';
  /** `true` si el usuario es administrador. */
  readonly esAdmin = this.rol === 'ADMINISTRADOR';
  /** `true` si el usuario es médico. */
  readonly esMedico = this.rol === 'MEDICO';
  /** Turnos de la agenda del médico para {@link fechaAgenda}. */
  readonly agenda = signal<AgendaItem[]>([]);
  /** Fecha (`YYYY-MM-DD`) de la agenda del médico; por defecto hoy en Argentina. */
  fechaAgenda = Reservations.hoyEnArgentina();
  /** Suscripción de la consulta de agenda en curso, para cancelarla al cambiar la fecha. */
  private consultaAgenda?: Subscription;
  /** Reservas listadas (paciente o administrador). */
  readonly reservas = signal<Reservation[]>([]);
  /** Médicos, para mostrar su nombre en el listado. */
  readonly medicos = signal<Doctor[]>([]);
  /** Pacientes (sólo administrador), para mostrar nombre y documento en el listado. */
  readonly pacientes = signal<Patient[]>([]);
  /** Filtro del administrador: documento exacto del paciente. */
  documento = '';
  /** Filtro del administrador: estado exacto; cadena vacía para todos. */
  estado = '';
  /** Opciones del selector de estado. */
  readonly estados = [
    { label: 'Todos los estados', value: '' },
    { label: 'Activo', value: 'ACTIVO' },
    { label: 'Atendido', value: 'ATENDIDO' },
    { label: 'Ausente', value: 'AUSENTE' },
    { label: 'Cancelado', value: 'CANCELADO' },
  ];
  /** `true` mientras se carga el listado o la agenda. */
  readonly cargando = signal(false);
  /** Mensaje de error de carga; cadena vacía si no hay error. */
  readonly error = signal('');
  /** `true` mientras se cancela una reserva. */
  readonly cancelando = signal(false);
  /** `true` mientras se registra una atención o ausencia. */
  readonly marcando = signal(false);
  /** Visibilidad del diálogo de confirmación de cancelación. */
  mostrarConfirmacion = false;
  /** Reserva elegida para cancelar. */
  reservaSeleccionada?: Reservation;

  /** Carga el listado o la agenda según el rol e inicia el reloj. */
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

  /** Cancela la consulta de agenda pendiente y detiene el reloj. */
  ngOnDestroy(): void {
    this.consultaAgenda?.unsubscribe();
    clearInterval(this.reloj);
  }

  /**
   * Abre el selector nativo de fecha del navegador, si está disponible.
   *
   * @param input Campo de fecha.
   */
  abrirCalendario(input: HTMLInputElement): void {
    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
      } catch {
        input.focus();
      }
    }
  }

  /**
   * Carga la agenda del médico para {@link fechaAgenda}. Cancela una consulta
   * anterior en curso y no consulta si la fecha está vacía.
   */
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

  /**
   * Carga las reservas (propias para el paciente; con filtros para el
   * administrador) y luego los médicos y pacientes necesarios para mostrar
   * nombres en la tabla.
   */
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

  /**
   * Indica si la reserva puede cancelarse ahora, según las reglas del backend:
   * sólo reservas `ACTIVO`; el administrador hasta el inicio del turno y el
   * paciente hasta el día calendario anterior (hora de Argentina).
   *
   * @param reserva Reserva a evaluar.
   */
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

  /**
   * Abre el diálogo de confirmación para cancelar una reserva, si aún está en plazo.
   *
   * @param reserva Reserva a cancelar.
   */
  solicitarCancelacion(reserva: Reservation): void {
    this.ahora.set(Date.now());
    if (!this.puedeCancelar(reserva)) return;
    this.reservaSeleccionada = reserva;
    this.mostrarConfirmacion = true;
  }

  /**
   * Confirma la cancelación de {@link reservaSeleccionada}.
   *
   * Reevalúa el plazo antes de llamar al backend; si venció, cierra el
   * diálogo y avisa. Tras cancelar, actualiza la fila, muestra un toast y
   * recarga el listado.
   */
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

  /**
   * El médico puede registrar la atención desde el inicio de la consulta (inclusive).
   *
   * @param reserva Turno de la agenda.
   */
  yaEmpezo(reserva: AgendaItem): boolean {
    const inicio = new Date(reserva.dateTime);
    if (Number.isNaN(inicio.getTime())) return false;
    return this.ahora() >= inicio.getTime();
  }

  /** Acciones del menú "Marcar como", con etiqueta, ayuda y estado destino. */
  private readonly accionesAtencion = [
    { label: 'Atendido', hint: 'El paciente asistió a la consulta', value: 'ATENDIDO' as const },
    { label: 'Ausente', hint: 'El paciente no se presentó', value: 'AUSENTE' as const },
  ];
  /** Turno cuyo menú "Marcar como" está abierto. */
  reservaEnMenu?: AgendaItem;
  /** `true` mientras el menú "Marcar como" está visible. */
  menuAbierto = false;

  /**
   * Opciones del menú "Marcar como": todas menos el estado actual del turno.
   *
   * @param reserva Turno seleccionado; sin turno devuelve una lista vacía.
   */
  opcionesAtencion(reserva?: AgendaItem) {
    if (!reserva) return [];
    return this.accionesAtencion.filter((accion) => accion.value !== reserva.state);
  }

  /**
   * Abre el menú "Marcar como" para un turno, o lo cierra si ya estaba abierto
   * para ese mismo turno.
   *
   * @param event Evento de clic que ancla el popover.
   * @param reserva Turno seleccionado.
   * @param menu Popover de PrimeNG.
   */
  abrirMenu(event: Event, reserva: AgendaItem, menu: Popover): void {
    if (this.reservaEnMenu?.id === reserva.id && this.menuAbierto) {
      menu.hide();
      return;
    }
    this.reservaEnMenu = reserva;
    menu.hide();
    menu.show(event);
  }

  /**
   * Aplica la acción elegida en el menú al turno en {@link reservaEnMenu}.
   *
   * @param estado Estado a registrar.
   * @param menu Popover a cerrar.
   */
  elegirAccion(estado: 'ATENDIDO' | 'AUSENTE', menu: Popover): void {
    const reserva = this.reservaEnMenu;
    menu.hide();
    if (!reserva) return;
    this.marcarAtencion(reserva, estado);
  }

  /**
   * Indica si el médico puede marcar el turno con ese estado: debe ser médico,
   * el estado debe ser distinto del actual, el turno no debe estar cancelado y
   * debe haber comenzado.
   *
   * @param reserva Turno de la agenda.
   * @param estado Estado destino.
   */
  puedeMarcar(reserva: AgendaItem, estado: 'ATENDIDO' | 'AUSENTE'): boolean {
    if (!this.esMedico || reserva.state === estado) return false;
    if (reserva.state === 'CANCELADO') return false;
    return this.yaEmpezo(reserva);
  }

  /**
   * Registra la atención o ausencia de un turno en el backend.
   *
   * Si la regla local no lo permite muestra un toast. Tras el éxito actualiza
   * el estado en la agenda; si falla muestra el mensaje del backend (o uno
   * genérico) y recarga la agenda.
   *
   * @param reserva Turno de la agenda.
   * @param estado Estado a registrar.
   */
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

  /**
   * Carga los médicos y, para el administrador, los pacientes referenciados
   * por las reservas. Un error en estas consultas auxiliares no impide
   * mostrar las reservas: se devuelven listas vacías.
   *
   * @param reservas Reservas ya obtenidas.
   * @returns Observable con las reservas, médicos y pacientes.
   */
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

  /**
   * Nombre completo del paciente, o `Paciente #id` si no está en la lista.
   *
   * @param id Identificador del paciente.
   */
  nombrePaciente(id: number): string {
    const paciente = this.pacientes().find((item) => item.id === id);
    return paciente ? `${paciente.firstName} ${paciente.lastName}` : `Paciente #${id}`;
  }

  /**
   * Documento del paciente, o `—` si no está en la lista.
   *
   * @param id Identificador del paciente.
   */
  documentoPaciente(id: number): string {
    return this.pacientes().find((paciente) => paciente.id === id)?.document ?? '—';
  }

  /**
   * Nombre completo del médico, o `Médico #id` si no está en la lista.
   *
   * @param id Identificador del médico.
   */
  nombreMedico(id: number): string {
    const medico = this.medicos().find((item) => item.id === id);
    return medico ? `${medico.nombres} ${medico.apellidos}` : `Médico #${id}`;
  }

  /**
   * Fecha del turno como `dd/mm/aaaa` en hora de Argentina.
   *
   * @param dateTime Instante ISO 8601.
   */
  fecha(dateTime: string): string {
    return new Intl.DateTimeFormat('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateTime));
  }

  /**
   * Hora del turno como `HH:mm` en hora de Argentina.
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
   * Formatea un importe como moneda argentina.
   *
   * @param amount Importe en pesos.
   */
  valor(amount: number): string {
    return formatearValor(amount);
  }
}
