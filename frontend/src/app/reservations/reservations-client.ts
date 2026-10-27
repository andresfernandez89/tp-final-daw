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

  obtenerPacientes() {
    return this.http.get<Patient[]>(`${API_BASE_URL}/patients`);
  }

  obtenerMedicos() {
    return this.http.get<Doctor[]>(`${API_BASE_URL}/doctors`);
  }
}
