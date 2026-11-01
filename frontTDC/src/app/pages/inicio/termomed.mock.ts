// =====================================================================
// termomed.mock.ts
// Ubicación sugerida: src/app/services/termomed.mock.ts
//
// Datos de mentira para ver las pantallas sin backend. Cuando la API
// esté lista, se pone USAR_MOCK = false y este archivo deja de usarse.
// =====================================================================

import { CurrentStateDTO, HistorialCompletoDTO } from "../../models/interfaces";



/** Interruptor general: true = datos falsos, false = API real. */
export const USAR_MOCK = true;

/** Cambiá este valor para ver cada estado de la pantalla de Inicio. */
const ESTADO_MOCK: 'azul' | 'verde' | 'rojo' = 'azul';

const TEMPERATURA_POR_ESTADO = { azul: 13, verde: 25, rojo: 29.5 };

/** Simula GET /currentState (con una pequeña demora, como una red real). */
export async function mockEstadoActual(): Promise<CurrentStateDTO> {
  await new Promise((r) => setTimeout(r, 600));
  return {
    temperature: TEMPERATURA_POR_ESTADO[ESTADO_MOCK],
    color: ESTADO_MOCK,
  };
}

/**
 * Simula GET /historial: una medición por hora durante los últimos 10 días,
 * de la más reciente a la más antigua. Respeta el rango de fechas como lo
 * haría el backend.
 */
export async function mockHistorial(
  fechaDesde?: Date | null,
  fechaHasta?: Date | null,
): Promise<HistorialCompletoDTO> {
  await new Promise((r) => setTimeout(r, 600));

  const UNA_HORA = 60 * 60 * 1000;
  const ahora = Date.now();

  // 240 mediciones (10 días). La temperatura oscila entre ~20 y ~30 °C.
  const todas = Array.from({ length: 240 }, (_, i) => ({
    temperatura: Math.round((25 + 4 * Math.sin(i / 6) + 1.5 * Math.cos(i / 2.3)) * 2) / 2,
    fechaHora: new Date(ahora - i * UNA_HORA).toISOString(),
  }));

  const historial = todas.filter((p) => {
    const t = new Date(p.fechaHora).getTime();
    if (fechaDesde && t < fechaDesde.getTime()) return false;
    if (fechaHasta && t > fechaHasta.getTime()) return false;
    return true;
  });

  const actual = todas[0];
  return {
    historial,
    temperaturaActual: actual.temperatura,
    colorActual: actual.temperatura < 24 ? 'azul' : actual.temperatura > 26 ? 'rojo' : 'verde',
    fechaDesde: fechaDesde ? fechaDesde.toISOString() : null,
    fechaHasta: fechaHasta ? fechaHasta.toISOString() : null,
  };
}