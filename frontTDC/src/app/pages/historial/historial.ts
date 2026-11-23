// =====================================================================
// historial.component.ts
// Ubicación sugerida: src/app/pages/historial/historial.component.ts
//
// Pantalla de Historial de Mediciones: filtro por fechas, gráfico de
// evolución, mínima / promedio / máxima y lista de mediciones.
// Datos: GET /historial (TermomedService.obtenerHistorial), que recibe
// el rango fechaDesde / fechaHasta cada vez que el usuario lo cambia.
// =====================================================================

import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { config } from '../../config/config';

import { TermomedService } from '../../services/termomed.service';

import { HistorialCompletoDTO } from '../../models/interfaces';
import { USAR_MOCK, mockHistorial } from '../inicio/termomed.mock';
import { HeaderComponent } from '../../components/header/header';

interface Fila {
  fecha: Date;
  temperatura: number;
}

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [DatePipe, HeaderComponent],
  templateUrl: './historial.html',
  styleUrl: './historial.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistorialComponent implements OnInit, OnDestroy {
  private temporizador?: ReturnType<typeof setInterval>;
  private consultaEnCurso = false;
  // ---------- Estado ----------
  readonly datos = signal<HistorialCompletoDTO | null>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  /** Fecha y hora local elegidas, en el formato de <input type="datetime-local">. */
  readonly desde = signal('');
  readonly hasta = signal('');

  private readonly fechaDesde = computed(() => this.desde() ? new Date(this.desde()) : null);
  private readonly fechaHasta = computed(() => this.hasta() ? new Date(this.hasta()) : null);

  readonly hayRango = computed(() => !!this.desde() || !!this.hasta());
  readonly rangoInvalido = computed(() => {
    const desde = this.fechaDesde();
    const hasta = this.fechaHasta();
    return desde !== null && hasta !== null && desde > hasta;
  });

  /** Se incrementa en cada pedido, para ignorar respuestas viejas si el usuario cambia rápido. */
  private turno = 0;

  // ---------- Datos derivados ----------

  /** Todas las mediciones, de la más reciente a la más antigua. */
  readonly filas = computed<Fila[]>(() => {
    const d = this.datos();
    if (!d) return [];
    return d.historial
      .map((p) => ({ fecha: new Date(p.fechaHora), temperatura: p.temperatura }))
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  });

  readonly resumen = computed(() => {
    const temps = this.filas().map((x) => x.temperatura);
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
    const resumen = this.resumen();
    if (!resumen || resumen.cantidad < 2) return null;

    const cronologico = [...this.filas()].reverse(); // de la más antigua a la más reciente
    const yMin = resumen.min - 2;
    const yMax = resumen.max + 2;
    const y = (t: number) => 104 - ((t - yMin) / (yMax - yMin)) * 98;
    const x = (i: number) => 8 + (i / (cronologico.length - 1)) * 284;

    const ultimo = cronologico[cronologico.length - 1];
    return {
      puntos: cronologico.map((p, i) => `${x(i).toFixed(1)},${y(p.temperatura).toFixed(1)}`).join(' '),
      ultimoX: x(cronologico.length - 1).toFixed(1),
      ultimoY: y(ultimo.temperatura).toFixed(1),
      desde: cronologico[0].fecha,
      hasta: ultimo.fecha,
    };
  });

  constructor(private readonly termomed: TermomedService) {}

  ngOnInit(): void {
    // Al entrar, cargamos el historial con las fechas seleccionadas. Luego se actualiza cada 12 segundos.
    this.cargar();
    this.temporizador = setInterval(() => {
      // Si el pedido anterior terminó, cargar(true) refresca los datos en segundo plano
      // para que el gráfico y la lista sigan visibles mientras llega la respuesta.
      if (!this.consultaEnCurso) this.cargar(true);
    }, config.intervaloActualizacionMs);
  }

  ngOnDestroy(): void {
    // Al salir, detenemos el temporizador. Cambiar el turno descarta cualquier respuesta pendiente.
    clearInterval(this.temporizador);
    this.turno++;
  }

  async cargar(enSegundoPlano = false): Promise<void> {
    if (this.rangoInvalido()) return; // el aviso ya se muestra en pantalla

    const turno = ++this.turno;
    this.consultaEnCurso = true;
    if (!enSegundoPlano) this.cargando.set(true);
    try {
      const desde = this.fechaDesde();
      const hasta = this.fechaHasta();

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
      if (turno === this.turno) {
        this.consultaEnCurso = false;
        this.cargando.set(false);
      }
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

  /** 13 -> "13,0", 13.5 -> "13,5" */
  formatear(valor: number): string {
    return (Math.round(valor * 10) / 10).toFixed(1).replace('.', ',');
  }
}
