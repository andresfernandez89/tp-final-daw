import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_BASE_URL } from '../core/api.config';
import type { Doctor } from '../reservations/reservations-client';

/** Cliente HTTP de las operaciones de administración de médicos. */
@Injectable({ providedIn: 'root' })
export class DoctorsClient {
  /** Cliente HTTP de Angular. */
  private readonly http = inject(HttpClient);

  /**
   * Actualiza el valor de consulta de un médico (`PATCH /doctors/:id/valor-consulta`).
   * Requiere rol `ADMINISTRADOR`.
   *
   * @param id Identificador del médico.
   * @param valorConsulta Nuevo valor, entero positivo en pesos.
   * @returns Observable con el médico actualizado.
   */
  actualizarValorConsulta(id: number, valorConsulta: number) {
    return this.http.patch<Doctor>(`${API_BASE_URL}/doctors/${id}/valor-consulta`, {
      valor_consulta: valorConsulta,
    });
  }
}
