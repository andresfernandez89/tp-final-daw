import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_BASE_URL } from '../../core/api.config';

export interface Medico {
  id: number;
  nombres: string;
  apellidos: string;
  valor_consulta: number;
}

export interface Paciente {
  id: number;
  document: string;
  firstName: string;
  lastName: string;
}

export interface HorarioDisponible {
  dateTime: string;
}

@Injectable({ providedIn: 'root' })
export class NewReservationClient {
  private readonly http = inject(HttpClient);

  obtenerMedicos() {
    return this.http.get<Medico[]>(`${API_BASE_URL}/doctors`);
  }

  obtenerPacientes() {
    return this.http.get<Paciente[]>(`${API_BASE_URL}/patients`);
  }

  obtenerHorarios(doctorId: number, fecha: string) {
    const params = new HttpParams().set('doctorId', doctorId).set('date', fecha);
    return this.http.get<HorarioDisponible[]>(`${API_BASE_URL}/reservations/availability`, {
      params,
    });
  }

  crearReserva(doctorId: number, dateTime: string, patientId?: number) {
    const reserva = patientId === undefined ? { doctorId, dateTime } : { doctorId, dateTime, patientId };
    return this.http.post(`${API_BASE_URL}/reservations`, reserva);
  }
}
