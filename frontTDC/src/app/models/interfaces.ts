// =====================================================================
// interfaces.ts
// Ubicación sugerida: src/app/models/interfaces.ts
//
// DTOs que viajan entre el front y la API. Los nombres y campos
// coinciden con los de la API para no tener que mapear nada.
// =====================================================================

/**
 * Body del POST /config.
 * Es lo que le mandamos al backend (y este al Arduino) cuando
 * el usuario toca "Guardar y enviar al dispositivo".
 */
export interface ConfigDTO {
  setpoint: number; // temperatura objetivo en °C
  tolerance: number; // margen permitido (±) en °C
  enviarNotificaciones: boolean; // true = avisar cuando salga del rango
}

/**
 * Respuesta del GET /currentState.
 * Es la lectura actual del sensor, junto con el color que tiene el LED RGB.
 */
export interface CurrentStateDTO {
  temperature: number;
  color: string; // por ejemplo 'azul' | 'verde' | 'rojo'
}

/**
 * Un punto del historial de temperaturas.
 * OJO: en JSON las fechas llegan como string ISO 8601
 * (ej: "2026-11-01T16:09:00.000Z"), por eso es string y no Date.
 * Si necesitás un Date, hacé new Date(fechaHora) al usarlo.
 */
export interface Historial {
  temperatura: number;
  fechaHora: string;
}

/**
 * Respuesta del GET /historial.
 * - fechaDesde / fechaHasta son el rango que aplicó el backend
 *   (null si no se filtró por fecha).
 * - colorActual es string, aunque en la definición de la API figuraba
 *   como float. Lo más probable es que fuera un error de tipeo, ya que
 *   en CurrentStateDTO el color es string. Confirmalo con el backend.
 */
export interface HistorialCompletoDTO {
  historial: Historial[];
  temperaturaActual: number;
  colorActual: string;
  fechaDesde: string | null;
  fechaHasta: string | null;
}
