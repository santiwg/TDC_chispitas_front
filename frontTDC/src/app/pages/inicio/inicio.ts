// =====================================================================
// inicio.component.ts
// Ubicación sugerida: src/app/pages/inicio/inicio.component.ts
//
// Pantalla de Inicio: muestra la temperatura actual y el color del LED
// que devuelve GET /currentState (TermomedService.obtenerEstadoActual).
// Se actualiza sola cada 30 segundos.
//
// Requiere Angular 17+ (standalone, signals y control flow @if/@for).
//
// CurrentStateDTO: { temperature: number; color: string }.
// Como la API no manda la fecha de la medición, la pantalla muestra la
// hora en que se consultó por última vez ("Actualizado").
// Si más adelante el DTO suma un campo de fecha, se usa en `armarVista`.
// =====================================================================

import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';

import { TermomedService } from '../../services/termomed.service';
import { CurrentStateDTO } from '../../models/interfaces';
import { mockEstadoActual, USAR_MOCK } from './termomed.mock';
import { HeaderComponent } from '../../components/header/header';

type ClaveEstado = 'azul' | 'verde' | 'rojo';

interface EstadoVista {
  clave: ClaveEstado;
  temperatura: number;
  fecha: Date | null;
  etiqueta: string; // chip: "Temperatura baja"
  titulo: string; // título del aviso
  detalle: string; // texto del aviso
  ledNombre: string; // "Azul" / "Verde" / "Rojo"
}

const TEXTOS: Record<ClaveEstado, Omit<EstadoVista, 'clave' | 'temperatura' | 'fecha'>> = {
  azul: {
    etiqueta: 'Temperatura baja',
    titulo: 'Temperatura por debajo del rango',
    detalle: 'Está por debajo del mínimo permitido. Revisá los medicamentos.',
    ledNombre: 'Azul',
  },
  verde: {
    etiqueta: 'Temperatura ideal',
    titulo: 'Dentro del rango ideal',
    detalle: 'La temperatura se mantiene dentro del rango configurado.',
    ledNombre: 'Verde',
  },
  rojo: {
    etiqueta: 'Temperatura alta',
    titulo: 'Temperatura por encima del rango',
    detalle: 'Está por encima del máximo permitido. Revisá los medicamentos.',
    ledNombre: 'Rojo',
  },
};

/** Convierte el color que manda la API (ej. "verde", "GREEN") a una clave conocida. */
function normalizarColor(color: string): ClaveEstado {
  const c = (color ?? '').toString().trim().toLowerCase();
  if (c === 'azul' || c === 'blue') return 'azul';
  if (c === 'rojo' || c === 'red') return 'rojo';
  return 'verde';
}

/** Único lugar donde se mapea el DTO de la API a lo que muestra la pantalla. */
function armarVista(dto: CurrentStateDTO): EstadoVista {
  const clave = normalizarColor(dto.color);
  return {
    clave,
    temperatura: dto.temperature,
    fecha: new Date(), // momento de la consulta (el DTO no trae fecha)
    ...TEXTOS[clave],
  };
}

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [DatePipe, HeaderComponent],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InicioComponent implements OnInit, OnDestroy {
  private static readonly INTERVALO_MS = 30_000;

  readonly estado = signal<EstadoVista | null>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  private temporizador?: ReturnType<typeof setInterval>;

  constructor(private readonly termomed: TermomedService) {}

  ngOnInit(): void {
    this.cargar();
    this.temporizador = setInterval(() => this.cargar(), InicioComponent.INTERVALO_MS);
  }

  ngOnDestroy(): void {
    clearInterval(this.temporizador);
  }

  async cargar(): Promise<void> {
    try {
      const dto = USAR_MOCK
        ? await mockEstadoActual()
        : await this.termomed.obtenerEstadoActual();
      this.estado.set(armarVista(dto));
      this.error.set(null);
    } catch (e) {
      // El service ya devuelve un mensaje legible
      this.error.set((e as Error).message);
    } finally {
      this.cargando.set(false);
    }
  }

  /** 13 -> "13", 13.5 -> "13,5" */
  formatearTemperatura(valor: number): string {
    return (Math.round(valor * 10) / 10).toString().replace('.', ',');
  }
}