import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_BASE_URL } from '../core/api.config';
import type { Doctor } from '../reservations/reservations-client';

@Injectable({ providedIn: 'root' })
export class DoctorsClient {
  private readonly http = inject(HttpClient);

  actualizarValorConsulta(id: number, valorConsulta: number) {
    return this.http.patch<Doctor>(`${API_BASE_URL}/doctors/${id}/valor-consulta`, {
      valor_consulta: valorConsulta,
    });
  }
}
