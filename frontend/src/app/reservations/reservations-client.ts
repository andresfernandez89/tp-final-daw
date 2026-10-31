import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_BASE_URL } from '../core/api.config';

/** Reserva tal como la devuelve la API (`OutputReservationDto` del backend). */
export interface Reservation {
  /** Identificador de la reserva. */
  id: number;
  /** Identificador del médico (`medicos.id`). */
  doctorId: number;
  /** Identificador del paciente (`usuarios.id`). */
  patientId: number;
  /** Inicio del turno en formato ISO 8601 (instante absoluto). */
  dateTime: string;
  /** Estado de la reserva. */
  state: 'ACTIVO' | 'ATENDIDO' | 'AUSENTE' | 'CANCELADO';
  /** Valor de consulta congelado al reservar, en pesos. */
  consultationFee: number;
}

/** Turno de la agenda del médico (`OutputAgendaItemDto` del backend): reserva más datos del paciente. */
export interface AgendaItem {
  /** Identificador de la reserva. */
  id: number;
  /** Inicio del turno en formato ISO 8601. */
  dateTime: string;
  /** Estado de la reserva. */
  state: Reservation['state'];
  /** Identificador del paciente. */
  patientId: number;
  /** Documento del paciente. */
  patientDocument: string;
  /** Nombres del paciente. */
  patientFirstName: string;
  /** Apellidos del paciente. */
  patientLastName: string;
  /** Valor de consulta congelado al reservar, en pesos. */
  consultationFee: number;
}

/** Médico activo tal como lo devuelve `GET /doctors`. */
export interface Doctor {
  /** Identificador del médico (`medicos.id`). */
  id: number;
  /** Nombres del médico. */
  nombres: string;
  /** Apellidos del médico. */
  apellidos: string;
  /** Valor de consulta vigente, en pesos. */
  valor_consulta: number;
}

/** Paciente activo tal como lo devuelve `GET /patients`. */
export interface Patient {
  /** Identificador del paciente (`usuarios.id`). */
  id: number;
  /** Documento del paciente. */
  document: string;
  /** Nombres del paciente. */
  firstName: string;
  /** Apellidos del paciente. */
  lastName: string;
}

/**
 * Cliente HTTP de reservas, médicos y pacientes para las pantallas de
 * listado y agenda. Todas las llamadas requieren sesión; el token lo agrega
 * el interceptor.
 */
@Injectable({ providedIn: 'root' })
export class ReservationsClient {
  /** Cliente HTTP de Angular. */
  private readonly http = inject(HttpClient);

  /**
   * Reservas del paciente autenticado (`GET /reservations`). Rol `PACIENTE`.
   *
   * @returns Observable con las reservas ordenadas por fecha y hora.
   */
  obtenerMisReservas() {
    return this.http.get<Reservation[]>(`${API_BASE_URL}/reservations`);
  }

  /**
   * Reservas de todos los pacientes (`GET /reservations/admin`). Rol `ADMINISTRADOR`.
   *
   * @param state Estado exacto a filtrar; cadena vacía para no filtrar.
   * @param document Documento exacto del paciente; cadena vacía o espacios para no filtrar.
   * @returns Observable con las reservas que cumplen los filtros.
   */
  obtenerReservasAdmin(state: string, document: string) {
    let params = new HttpParams();
    if (state) params = params.set('state', state);
    if (document.trim()) params = params.set('document', document.trim());
    return this.http.get<Reservation[]>(`${API_BASE_URL}/reservations/admin`, { params });
  }

  /**
   * Cancela una reserva (`PATCH /reservations/:id/cancel`). Roles `PACIENTE` y `ADMINISTRADOR`.
   *
   * @param id Identificador de la reserva.
   * @returns Observable con la reserva en estado `CANCELADO`.
   */
  cancelarReserva(id: number) {
    return this.http.patch<Reservation>(`${API_BASE_URL}/reservations/${id}/cancel`, {});
  }

  /**
   * Registra atención o ausencia (`PATCH /reservations/:id/attendance`). Rol `MEDICO`.
   *
   * @param id Identificador de la reserva.
   * @param state Estado a registrar.
   * @returns Observable con la reserva actualizada.
   */
  marcarAtencion(id: number, state: 'ATENDIDO' | 'AUSENTE') {
    return this.http.patch<Reservation>(`${API_BASE_URL}/reservations/${id}/attendance`, {
      state,
    });
  }

  /**
   * Agenda del médico autenticado para una fecha (`GET /reservations/agenda`). Rol `MEDICO`.
   *
   * @param date Fecha en formato `YYYY-MM-DD`.
   * @returns Observable con los turnos del día.
   */
  obtenerAgenda(date: string) {
    return this.http.get<AgendaItem[]>(`${API_BASE_URL}/reservations/agenda`, {
      params: new HttpParams().set('date', date),
    });
  }

  /**
   * Pacientes activos (`GET /patients`). Rol `ADMINISTRADOR`.
   *
   * @returns Observable con los pacientes ordenados por apellido y nombre.
   */
  obtenerPacientes() {
    return this.http.get<Patient[]>(`${API_BASE_URL}/patients`);
  }

  /**
   * Médicos activos (`GET /doctors`). Roles `PACIENTE` y `ADMINISTRADOR`.
   *
   * @returns Observable con los médicos ordenados por id.
   */
  obtenerMedicos() {
    return this.http.get<Doctor[]>(`${API_BASE_URL}/doctors`);
  }
}
