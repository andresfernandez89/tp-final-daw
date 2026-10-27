import { HttpClient } from '@angular/common/http';
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

@Injectable({ providedIn: 'root' })
export class ReservationsClient {
  private readonly http = inject(HttpClient);

  obtenerMisReservas() {
    return this.http.get<Reservation[]>(`${API_BASE_URL}/reservations`);
  }

  obtenerMedicos() {
    return this.http.get<Doctor[]>(`${API_BASE_URL}/doctors`);
  }
}
