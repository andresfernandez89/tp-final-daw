import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_BASE_URL } from '../core/api.config';

export interface Reservation {
  id: number;
  doctorId: number;
  patientId: number;
  dateTime: string;
  state: 'ACTIVO' | 'ATENDIDO' | 'AUSENTE' | 'CANCELADO';
  consultationFee: number;
}

export interface AgendaItem {
  id: number;
  dateTime: string;
  state: Reservation['state'];
  patientId: number;
  patientDocument: string;
  patientFirstName: string;
  patientLastName: string;
  consultationFee: number;
}

export interface Doctor {
  id: number;
  nombres: string;
  apellidos: string;
}

export interface Patient {
  id: number;
  document: string;
  firstName: string;
  lastName: string;
}

@Injectable({ providedIn: 'root' })
export class ReservationsClient {
  private readonly http = inject(HttpClient);

  obtenerMisReservas() {
    return this.http.get<Reservation[]>(`${API_BASE_URL}/reservations`);
  }

  obtenerReservasAdmin(state: string, document: string) {
    let params = new HttpParams();
    if (state) params = params.set('state', state);
    if (document.trim()) params = params.set('document', document.trim());
    return this.http.get<Reservation[]>(`${API_BASE_URL}/reservations/admin`, { params });
  }

  cancelarReserva(id: number) {
    return this.http.patch<Reservation>(`${API_BASE_URL}/reservations/${id}/cancel`, {});
  }

  marcarAtencion(id: number, state: 'ATENDIDO' | 'AUSENTE') {
    return this.http.patch<Reservation>(`${API_BASE_URL}/reservations/${id}/attendance`, {
      state,
    });
  }

  obtenerAgenda(date: string) {
    return this.http.get<AgendaItem[]>(`${API_BASE_URL}/reservations/agenda`, {
      params: new HttpParams().set('date', date),
    });
  }

  obtenerPacientes() {
    return this.http.get<Patient[]>(`${API_BASE_URL}/patients`);
  }

  obtenerMedicos() {
    return this.http.get<Doctor[]>(`${API_BASE_URL}/doctors`);
  }
}
