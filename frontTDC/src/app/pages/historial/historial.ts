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

  /** Fecha y hora argentina elegidas, en el formato de <input type="datetime-local">. */
  readonly desde = signal('');
  readonly hasta = signal('');
  readonly zonaHoraria = '-03:00';

  private readonly fechaDesde = computed(() =>
    this.desde() ? new Date(this.desde() + this.zonaHoraria) : null,
  );
  private readonly fechaHasta = computed(() =>
    this.hasta() ? new Date(this.hasta() + this.zonaHoraria) : null,
  );

  readonly hayRango = computed(() => !!this.desde() || !!this.hasta());
  readonly rangoInvalido = computed(() => {
    const desde = this.fechaDesde();
    const hasta = this.fechaHasta();
    return desde !== null && hasta !== null && desde > hasta;
  });

  /** Se incrementa en cada pedido, para ignorar respuestas viejas si el usuario cambia rápido. */
  private turno = 0;

  // ---------- Datos derivados ----------

  /** Aplica el rango incluso si el backend devuelve todas las mediciones. */
  readonly filas = computed<Fila[]>(() => {
    const d = this.datos();
    if (!d) return [];
    const desde = this.fechaDesde();
    const hasta = this.fechaHasta();
    return d.historial
      .map((p) => ({ fecha: new Date(p.fechaHora), temperatura: p.temperatura }))
      .filter(({ fecha }) => (!desde || fecha >= desde) && (!hasta || fecha <= hasta))
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

  /** Coordenadas y marcas de los ejes del gráfico. */
  readonly grafico = computed(() => {
    const resumen = this.resumen();
    if (!resumen || resumen.cantidad < 2) return null;

    const cronologico = [...this.filas()].reverse(); // de la más antigua a la más reciente
    const ultimo = cronologico[cronologico.length - 1];
    const desde = cronologico[0].fecha;
    const hasta = ultimo.fecha;
    const duracion = hasta.getTime() - desde.getTime();
    const x = (fecha: Date) =>
      duracion > 0 ? 42 + ((fecha.getTime() - desde.getTime()) / duracion) * 268 : 176;

    const paso = Math.max(1, Math.ceil((resumen.max - resumen.min + 2) / 4));
    const minimo = Math.floor((resumen.min - 1) / paso) * paso;
    const maximo = Math.ceil((resumen.max + 1) / paso) * paso;
    const y = (temperatura: number) => 124 - ((temperatura - minimo) / (maximo - minimo)) * 100;
    const marcas = Array.from({ length: (maximo - minimo) / paso + 1 }, (_, indice) => {
      const temperatura = maximo - indice * paso;
      return { temperatura, y: y(temperatura) };
    });

    return {
      marcas,
      puntos: cronologico.map((p) => `${x(p.fecha).toFixed(1)},${y(p.temperatura).toFixed(1)}`).join(' '),
      ultimoX: x(hasta).toFixed(1),
      ultimoY: y(ultimo.temperatura).toFixed(1),
      desde,
      hasta,
      tieneDuracion: duracion > 0,
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
      const dto = USAR_MOCK
        ? await mockHistorial(this.fechaDesde(), this.fechaHasta())
        : await this.termomed.obtenerHistorial(this.desde(), this.hasta());

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
