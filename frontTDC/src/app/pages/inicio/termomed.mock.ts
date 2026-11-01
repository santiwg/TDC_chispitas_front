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

/** Simula GET /historial: una medición por hora, de la más reciente a la más antigua. */
export async function mockHistorial(): Promise<HistorialCompletoDTO> {
  await new Promise((r) => setTimeout(r, 600));

  const temperaturas = [13, 15.5, 19, 23.5, 24.5, 25, 25.5, 26.5, 28, 25];
  const ahora = Date.now();

  return {
    historial: temperaturas.map((temperatura, i) => ({
      temperatura,
      fechaHora: new Date(ahora - i * 60 * 60 * 1000).toISOString(),
    })),
    temperaturaActual: temperaturas[0],
    colorActual: 'azul',
    fechaDesde: null,
    fechaHasta: null,
  };
}