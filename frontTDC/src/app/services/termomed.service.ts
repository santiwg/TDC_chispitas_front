// =====================================================================
// termomed.service.ts
// Ubicación sugerida: src/app/services/termomed.service.ts
//
// Service que concentra TODAS las llamadas a la API del termómetro.
// Los componentes nunca usan axios directo: llaman a estos métodos.
//
// Convención de errores:
// Cada método tiene su try/catch. Si algo falla, lanzamos un Error con
// un mensaje ya legible para el usuario, así el componente solo hace
// `catch (e) { mostrar(e.message) }` sin conocer detalles de axios.
// =====================================================================

import { Injectable } from '@angular/core';
import { isAxiosError } from 'axios';

import { axiosClient } from './axios-client'; // el cliente que ya tenían (ajustar ruta si es otra)
import { config } from '../config/config';
import {
  ConfigDTO,
  CurrentStateDTO,
  HistorialCompletoDTO,
} from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class TermomedService {
  // URL base tomada de las variables de entorno (ver config.ts)
  private readonly baseUrl = config.urls.api;

  /**
   * POST /config
   * Envía setpoint, tolerancia y si se quieren notificaciones.
   * La API responde con un string de éxito, que devolvemos tal cual
   * para mostrárselo al usuario.
   */
  async guardarConfig(dto: ConfigDTO): Promise<string> {
    try {
      const respuesta = await axiosClient.post<string>(
        `${this.baseUrl}/config`,
        dto,
      );
      return respuesta.data;
    } catch (error) {
      throw new Error(
        this.obtenerMensajeError(error, 'No se pudo guardar la configuración.'),
      );
    }
  }

  /**
   * GET /currentState
   * Temperatura actual y color del LED. Se usa en la pantalla de Inicio.
   */
  async obtenerEstadoActual(): Promise<CurrentStateDTO> {
    try {
      const respuesta = await axiosClient.get<CurrentStateDTO>(
        `${this.baseUrl}/currentState`,
      );
      return respuesta.data;
    } catch (error) {
      throw new Error(
        this.obtenerMensajeError(error, 'No se pudo obtener el estado actual.'),
      );
    }
  }

  /**
   * GET /historial
   * Historial de temperaturas. El rango de fechas es opcional.
   * ASUMO que la API recibe fechaDesde/fechaHasta como query params
   * (la definición no lo aclara). Si el backend los espera de otra forma,
   * se cambia solo acá.
   */
  async obtenerHistorial(
    fechaDesde?: Date | null,
    fechaHasta?: Date | null,
  ): Promise<HistorialCompletoDTO> {
    try {
      // Solo mandamos los params que realmente tienen valor
      const params: Record<string, string> = {};
      if (fechaDesde) params['fechaDesde'] = fechaDesde.toISOString();
      if (fechaHasta) params['fechaHasta'] = fechaHasta.toISOString();

      const respuesta = await axiosClient.get<HistorialCompletoDTO>(
        `${this.baseUrl}/historial`,
        { params },
      );
      return respuesta.data;
    } catch (error) {
      throw new Error(
        this.obtenerMensajeError(error, 'No se pudo obtener el historial.'),
      );
    }
  }

  /**
   * Convierte cualquier error en un mensaje legible.
   * Distingue tres casos:
   *  1) El servidor respondió con error (400, 500...): usamos su mensaje si lo trae.
   *  2) No hubo respuesta (servidor apagado, sin red, timeout): mensaje de conexión.
   *  3) Cualquier otro error inesperado: mensaje por defecto.
   */
  private obtenerMensajeError(error: unknown, mensajePorDefecto: string): string {
    if (isAxiosError(error)) {
      if (error.response) {
        const data = error.response.data;
        // El backend puede devolver el error como string o como { message }
        if (typeof data === 'string' && data.trim()) return data;
        if (data && typeof data === 'object' && 'message' in data) {
          return String((data as { message: unknown }).message);
        }
        return `${mensajePorDefecto} (código ${error.response.status})`;
      }
      if (error.request) {
        return 'No se pudo conectar con el servidor. Revisá tu conexión.';
      }
    }
    return mensajePorDefecto;
  }
}
