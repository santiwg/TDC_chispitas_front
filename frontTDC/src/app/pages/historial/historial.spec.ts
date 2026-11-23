import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorialCompletoDTO } from '../../models/interfaces';
import { axiosClient } from '../../services/axios-client';
import { HistorialComponent } from './historial';

describe('HistorialComponent', () => {
  const adaptadorOriginal = axiosClient.defaults.adapter;
  const consultas: URL[] = [];
  const historialSinFiltrar: HistorialCompletoDTO = {
    historial: [
      { fechaHora: '2026-11-24T02:29:59.000Z', temperatura: 21 },
      { fechaHora: '2026-11-24T02:30:00.000Z', temperatura: 24 },
      { fechaHora: '2026-11-24T02:34:00.000Z', temperatura: 26 },
      { fechaHora: '2026-11-24T03:00:00.000Z', temperatura: 28 },
      { fechaHora: '2026-11-24T03:00:01.000Z', temperatura: 31 },
    ],
    temperaturaActual: 31,
    colorActual: 'rojo',
    fechaDesde: null,
    fechaHasta: null,
  };
  let fixture: ComponentFixture<HistorialComponent>;

  beforeEach(async () => {
    consultas.length = 0;
    axiosClient.defaults.adapter = async (config) => {
      consultas.push(new URL(axiosClient.getUri(config)));
      return { config, data: historialSinFiltrar, status: 200, statusText: 'OK', headers: {} };
    };

    fixture = TestBed.createComponent(HistorialComponent);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    axiosClient.defaults.adapter = adaptadorOriginal;
  });

  async function elegirRango() {
    const vista: HTMLElement = fixture.nativeElement;
    const [desde, hasta] = vista.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]');
    desde.value = '2026-11-23T23:30';
    desde.dispatchEvent(new Event('change'));
    hasta.value = '2026-11-24T00:00';
    hasta.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    return vista;
  }

  it('envía los límites tal como se eligieron y aplica el rango al historial recibido', async () => {
    const vista = await elegirRango();

    expect(consultas.at(-2)?.searchParams.get('fechaDesde')).toBe('2026-11-23T23:30');
    expect(consultas.at(-2)?.searchParams.has('fechaHasta')).toBe(false);
    const consulta = consultas.at(-1);
    expect(consulta?.searchParams.get('fechaDesde')).toBe('2026-11-23T23:30');
    expect(consulta?.searchParams.get('fechaHasta')).toBe('2026-11-24T00:00');
    expect([...vista.querySelectorAll('.fila__momento strong')].map((fila) => fila.textContent?.trim()))
      .toEqual(['00:00 hs', '23:34 hs', '23:30 hs']);
  });

  it('dibuja la escala en °C y separa los puntos según la hora de medición', async () => {
    const vista = await elegirRango();
    const grafico = vista.querySelector('svg.grafico');
    expect(grafico?.querySelector('.grafico__unidad')?.textContent).toBe('°C');
    expect([...grafico!.querySelectorAll('.grafico__marca')].map((marca) => marca.textContent?.trim()))
      .toEqual(['30', '28', '26', '24', '22']);

    const puntos = grafico?.querySelector('polyline')?.getAttribute('points')?.split(' ');
    expect(puntos).toHaveLength(3);
    const [inicio, intermedio, fin] = puntos!.map((punto) => Number(punto.split(',')[0]));
    expect((intermedio - inicio) / (fin - inicio)).toBeCloseTo(4 / 30, 3);
  });
});
