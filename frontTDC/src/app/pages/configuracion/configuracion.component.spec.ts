import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { routes } from '../../app.routes';
import { TermomedService } from '../../services/termomed.service';
import { ConfiguracionComponent } from './configuracion.component';

describe('ConfiguracionComponent', () => {
  const claveConfiguracion = 'termomed.configuracion';
  const guardarConfig = vi.fn<TermomedService['guardarConfig']>();

  beforeEach(() => {
    localStorage.removeItem(claveConfiguracion);
    guardarConfig.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        {
          provide: TermomedService,
          useValue: {
            guardarConfig,
            obtenerEstadoActual: async () => ({
              temperatura: 25,
              color: 'verde',
              velocityRmp: 0,
              velocityPercent: 0,
            }),
          },
        },
      ],
    });
  });

  afterEach(() => localStorage.removeItem(claveConfiguracion));

  it('restaura los valores al volver de Inicio con el envío todavía pendiente', async () => {
    let responder!: (mensaje: string) => void;
    guardarConfig.mockReturnValueOnce(
      new Promise((resolve) => {
        responder = resolve;
      }),
    );

    const router = await RouterTestingHarness.create();
    const configuracion = await router.navigateByUrl('/configuracion', ConfiguracionComponent);
    configuracion.aumentarSetpoint();
    configuracion.aumentarTolerancia();
    configuracion.alternarAlertas();
    const envio = configuracion.guardar();

    await router.navigateByUrl('/inicio');
    const restaurada = await router.navigateByUrl('/configuracion', ConfiguracionComponent);
    const valoresRestaurados = [
      restaurada.setpoint(),
      restaurada.tolerancia(),
      restaurada.alertasActivas(),
    ];

    responder('Configuración guardada correctamente.');
    await envio;

    expect(valoresRestaurados).toEqual([25.5, 1.5, false]);
  });

  it('reemplaza la copia local al enviar aunque la API devuelva un error', async () => {
    localStorage.setItem(
      claveConfiguracion,
      JSON.stringify({ setpoint: 30, tolerancia: 2, alertas: false }),
    );
    guardarConfig.mockRejectedValueOnce(new Error('No se pudo conectar con el servidor.'));

    const router = await RouterTestingHarness.create();
    const configuracion = await router.navigateByUrl('/configuracion', ConfiguracionComponent);
    configuracion.aumentarSetpoint();
    await configuracion.guardar();

    expect(configuracion.mensaje()).toEqual({
      tipo: 'error',
      texto: 'No se pudo conectar con el servidor. La configuración quedó guardada en este navegador.',
    });
    expect(JSON.parse(localStorage.getItem(claveConfiguracion)!)).toEqual({
      setpoint: 30.5,
      tolerancia: 2,
      alertas: false,
    });
  });
});
