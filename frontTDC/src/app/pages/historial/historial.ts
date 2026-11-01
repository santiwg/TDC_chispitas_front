// =====================================================================
// historial.component.ts
// Ubicación sugerida: src/app/pages/historial/historial.component.ts
//
// Pantalla de Historial de Mediciones: filtro por fechas, gráfico de
// evolución, mínima / promedio / máxima, filtros por estado y lista.
// Datos: GET /historial (TermomedService.obtenerHistorial), que recibe
// el rango fechaDesde / fechaHasta cada vez que el usuario lo cambia.
//
// IMPORTANTE: la API no manda el estado (azul/verde/rojo) de cada
// medición, solo el color ACTUAL. Por eso cada punto se clasifica acá
// con RANGO_IDEAL. Es un valor fijo temporal: lo correcto es que el
// backend devuelva el color de cada punto (o el setpoint y la tolerancia).
// =====================================================================

import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';

import { TermomedService } from '../../services/termomed.service';

import { HistorialCompletoDTO } from '../../models/interfaces';
import { USAR_MOCK, mockHistorial } from '../inicio/termomed.mock';
import { HeaderComponent } from '../../components/header/header';

type ClaveEstado = 'azul' | 'verde' | 'rojo';
type Filtro = 'todas' | ClaveEstado;

/** Rango considerado ideal (ej. setpoint 25 °C con tolerancia ±1 °C). */
const RANGO_IDEAL = { min: 24, max: 26 };

const ETIQUETAS: Record<ClaveEstado, string> = {
  azul: 'Baja',
  verde: 'Ideal',
  rojo: 'Alta',
};

function clasificar(temperatura: number): ClaveEstado {
  if (temperatura < RANGO_IDEAL.min) return 'azul';
  if (temperatura > RANGO_IDEAL.max) return 'rojo';
  return 'verde';
}

interface Fila {
  fecha: Date;
  temperatura: number;
  clave: ClaveEstado;
  etiqueta: string;
}

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [DatePipe, HeaderComponent],
  templateUrl: './historial.html',
  styleUrl: './historial.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistorialComponent implements OnInit {
  // ---------- Estado ----------
  readonly datos = signal<HistorialCompletoDTO | null>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly filtro = signal<Filtro>('todas');

  /** Fechas elegidas, en el formato de <input type="date">: "2026-11-01" o "" si no hay. */
  readonly desde = signal('');
  readonly hasta = signal('');

  readonly hayRango = computed(() => !!this.desde() || !!this.hasta());
  readonly rangoInvalido = computed(
    () => !!this.desde() && !!this.hasta() && this.desde() > this.hasta(),
  );

  /** Se incrementa en cada pedido, para ignorar respuestas viejas si el usuario cambia rápido. */
  private turno = 0;

  readonly opcionesFiltro: { valor: Filtro; texto: string }[] = [
    { valor: 'todas', texto: 'Todas' },
    { valor: 'azul', texto: 'Bajas' },
    { valor: 'verde', texto: 'Ideales' },
    { valor: 'rojo', texto: 'Altas' },
  ];

  // ---------- Datos derivados ----------

  /** Todas las mediciones, de la más reciente a la más antigua. */
  private readonly todas = computed<Fila[]>(() => {
    const d = this.datos();
    if (!d) return [];
    return d.historial
      .map((p) => {
        const clave = clasificar(p.temperatura);
        return {
          fecha: new Date(p.fechaHora),
          temperatura: p.temperatura,
          clave,
          etiqueta: ETIQUETAS[clave],
        };
      })
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  });

  /** Las mediciones que se muestran en la lista, según el filtro. */
  readonly filas = computed<Fila[]>(() => {
    const f = this.filtro();
    return f === 'todas' ? this.todas() : this.todas().filter((x) => x.clave === f);
  });

  readonly resumen = computed(() => {
    const temps = this.todas().map((x) => x.temperatura);
    if (!temps.length) return null;
    return {
      min: Math.min(...temps),
      max: Math.max(...temps),
      promedio: temps.reduce((a, b) => a + b, 0) / temps.length,
      cantidad: temps.length,
    };
  });

  /** Datos ya calculados para dibujar el SVG (viewBox 300 x 110). */
  readonly grafico = computed(() => {
    const cronologico = [...this.todas()].reverse(); // de la más antigua a la más reciente
    if (cronologico.length < 2) return null;

    const temps = cronologico.map((x) => x.temperatura);
    const yMin = Math.min(...temps, RANGO_IDEAL.min) - 2;
    const yMax = Math.max(...temps, RANGO_IDEAL.max) + 2;
    const y = (t: number) => 104 - ((t - yMin) / (yMax - yMin)) * 98;
    const x = (i: number) => 8 + (i / (cronologico.length - 1)) * 284;

    const ultimo = cronologico[cronologico.length - 1];
    return {
      puntos: cronologico.map((p, i) => `${x(i).toFixed(1)},${y(p.temperatura).toFixed(1)}`).join(' '),
      bandaY: y(RANGO_IDEAL.max).toFixed(1),
      bandaAlto: (y(RANGO_IDEAL.min) - y(RANGO_IDEAL.max)).toFixed(1),
      ultimoX: x(cronologico.length - 1).toFixed(1),
      ultimoY: y(ultimo.temperatura).toFixed(1),
      ultimoClave: ultimo.clave,
      desde: cronologico[0].fecha,
      hasta: ultimo.fecha,
    };
  });

  constructor(private readonly termomed: TermomedService) {}

  ngOnInit(): void {
    this.cargar();
  }

  async cargar(): Promise<void> {
    if (this.rangoInvalido()) return; // el aviso ya se muestra en pantalla

    const turno = ++this.turno;
    this.cargando.set(true);
    try {
      // "Desde" arranca a las 00:00 y "Hasta" llega hasta las 23:59 de ese día
      const desde = this.aFecha(this.desde(), false);
      const hasta = this.aFecha(this.hasta(), true);

      const dto = USAR_MOCK
        ? await mockHistorial(desde, hasta)
        : await this.termomed.obtenerHistorial(desde, hasta);

      if (turno !== this.turno) return; // llegó una respuesta vieja: se descarta
      this.datos.set(dto);
      this.error.set(null);
    } catch (e) {
      if (turno !== this.turno) return;
      // El service ya devuelve un mensaje legible
      this.error.set((e as Error).message);
    } finally {
      if (turno === this.turno) this.cargando.set(false);
    }
  }

  cambiarDesde(valor: string): void {
    this.desde.set(valor);
    this.cargar();
  }

  cambiarHasta(valor: string): void {
    this.hasta.set(valor);
    this.cargar();
  }

  limpiarFechas(): void {
    this.desde.set('');
    this.hasta.set('');
    this.cargar();
  }

  /** "2026-11-01" -> Date en hora local (inicio o fin del día). "" -> null. */
  private aFecha(valor: string, finDelDia: boolean): Date | null {
    if (!valor) return null;
    const [anio, mes, dia] = valor.split('-').map(Number);
    return finDelDia
      ? new Date(anio, mes - 1, dia, 23, 59, 59, 999)
      : new Date(anio, mes - 1, dia, 0, 0, 0, 0);
  }

  elegirFiltro(valor: Filtro): void {
    this.filtro.set(valor);
  }

  /** 13 -> "13,0", 13.5 -> "13,5" */
  formatear(valor: number): string {
    return (Math.round(valor * 10) / 10).toFixed(1).replace('.', ',');
  }
}