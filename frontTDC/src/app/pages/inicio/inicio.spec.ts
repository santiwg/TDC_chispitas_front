import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentStateDTO } from '../../models/interfaces';
import { axiosClient } from '../../services/axios-client';
import { InicioComponent } from './inicio';

describe('InicioComponent', () => {
  const adaptadorOriginal = axiosClient.defaults.adapter;
  let respuesta: CurrentStateDTO | '';
  let fixture: ComponentFixture<InicioComponent>;

  beforeEach(() => {
    axiosClient.defaults.adapter = async (config) => ({
      config,
      data: respuesta,
      status: 200,
      statusText: 'OK',
      headers: {},
    });
    fixture = TestBed.createComponent(InicioComponent);
  });

  afterEach(() => {
    axiosClient.defaults.adapter = adaptadorOriginal;
  });

  async function renderizarInicio(): Promise<HTMLElement> {
    const cargar = vi.spyOn(fixture.componentInstance, 'cargar');
    fixture.detectChanges();
    await cargar.mock.results[0].value;
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('muestra la temperatura, el LED y la velocidad devueltos por current-state', async () => {
    respuesta = { temperatura: 28, color: '#2878FF', velocityRmp: 600, velocityPercent: 30 };

    const vista = await renderizarInicio();
    expect(vista.querySelector('.temperatura__valor')?.textContent?.trim()).toBe('28');
    expect(vista.querySelector('.estado-azul .datos dd')?.textContent?.trim()).toBe('Azul');
    expect(vista.querySelector('.velocidad')?.textContent).toContain('600');
    expect(vista.querySelector('.velocidad')?.textContent).toContain('30');
  });

  it('muestra un aviso cuando la API todavía no tiene mediciones', async () => {
    respuesta = '';

    const vista = await renderizarInicio();
    expect(vista.textContent).toContain('Todavía no hay mediciones registradas.');
    expect(vista.querySelector('[role="alert"]')).toBeNull();
  });
});
