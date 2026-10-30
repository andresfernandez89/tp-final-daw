import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_BASE_URL } from '../../core/api.config';

/** Médico activo tal como lo devuelve `GET /doctors`. */
export interface Medico {
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
export interface Paciente {
  /** Identificador del paciente (`usuarios.id`). */
  id: number;
  /** Documento del paciente. */
  document: string;
  /** Nombres del paciente. */
  firstName: string;
  /** Apellidos del paciente. */
  lastName: string;
}

/** Turno libre tal como lo devuelve `GET /reservations/availability`. */
export interface HorarioDisponible {
  /** Inicio del turno en formato `YYYY-MM-DDTHH:00:00-03:00`; es el valor que se envía al reservar. */
  dateTime: string;
}

/** Cliente HTTP de la pantalla de nueva reserva. */
@Injectable({ providedIn: 'root' })
export class NewReservationClient {
  /** Cliente HTTP de Angular. */
  private readonly http = inject(HttpClient);

  /**
   * Médicos activos (`GET /doctors`).
   *
   * @returns Observable con los médicos ordenados por id.
   */
  obtenerMedicos() {
    return this.http.get<Medico[]>(`${API_BASE_URL}/doctors`);
  }

  /**
   * Pacientes activos (`GET /patients`). Sólo para `ADMINISTRADOR`.
   *
   * @returns Observable con los pacientes ordenados por apellido y nombre.
   */
  obtenerPacientes() {
    return this.http.get<Paciente[]>(`${API_BASE_URL}/patients`);
  }

  /**
   * Turnos libres de un médico para una fecha (`GET /reservations/availability`).
   *
   * @param doctorId Identificador del médico.
   * @param fecha Fecha `YYYY-MM-DD`, entre hoy y 30 días en adelante.
   * @returns Observable con los horarios disponibles.
   */
  obtenerHorarios(doctorId: number, fecha: string) {
    const params = new HttpParams().set('doctorId', doctorId).set('date', fecha);
    return this.http.get<HorarioDisponible[]>(`${API_BASE_URL}/reservations/availability`, {
      params,
    });
  }

  /**
   * Crea una reserva (`POST /reservations`).
   *
   * @param doctorId Identificador del médico.
   * @param dateTime Horario tomado de la disponibilidad.
   * @param patientId Paciente para quien reserva el administrador; el paciente lo omite.
   * @returns Observable con la reserva creada. Responde `409` si el horario ya está ocupado.
   */
  crearReserva(doctorId: number, dateTime: string, patientId?: number) {
    const reserva =
      patientId === undefined ? { doctorId, dateTime } : { doctorId, dateTime, patientId };
    return this.http.post(`${API_BASE_URL}/reservations`, reserva);
  }
}
