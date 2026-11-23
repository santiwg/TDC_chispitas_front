// =====================================================================
// configuracion.component.ts
// Ubicación: src/app/pages/configuracion/configuracion.component.ts
//
// Pantalla "Configuración": el usuario define la temperatura objetivo
// (setpoint), la tolerancia y si quiere alertas. Al tocar
// "Guardar y enviar al dispositivo" se manda todo a la API
// a través de TermomedService.
//
// Para manejar el estado usamos SIGNALS (la forma moderna de Angular):
//  - signal(valor): una variable reactiva. Se lee con setpoint() y se
//    cambia con setpoint.set(...) o setpoint.update(...).
//  - computed(() => ...): un valor calculado a partir de otros signals.
//    Se recalcula solo cuando cambia alguno de los signals que usa.
// El HTML lee los signals y se actualiza solo, sin código extra.
// =====================================================================

import { Component, computed, inject, signal, type WritableSignal } from '@angular/core';

import { TermomedService } from '../../services/termomed.service';
import { ConfigDTO } from '../../models/interfaces';
import { HeaderComponent } from '../../components/header/header';

const CLAVE_CONFIGURACION = 'termomed.configuracion';

// Forma del mensaje que se muestra debajo del botón (éxito o error)
interface MensajeEstado {
  tipo: 'exito' | 'error';
  texto: string;
}

@Component({
  selector: 'app-configuracion',
  standalone: true,
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.css',
  imports:[HeaderComponent]
})
export class ConfiguracionComponent {
  // inject() nos da la instancia única del service (providedIn: 'root')
  private readonly termomed = inject(TermomedService);

  // ---------------------------------------------------------------
  // Límites y paso de los botones + y -
  // Están como constantes para cambiarlos fácil sin tocar la lógica.
  // Ajustalos al rango real que soporte el sensor / la conservadora.
  // ---------------------------------------------------------------
  private readonly SETPOINT_MIN = 0;
  private readonly SETPOINT_MAX = 50;
  private readonly SETPOINT_PASO = 0.5;

  private readonly TOLERANCIA_MIN = 0.5;
  private readonly TOLERANCIA_MAX = 15;
  private readonly TOLERANCIA_PASO = 0.5;

  // ---------------------------------------------------------------
  // Estado de la pantalla
  // ---------------------------------------------------------------
  readonly setpoint: WritableSignal<number>;
  readonly tolerancia: WritableSignal<number>;
  readonly alertasActivas: WritableSignal<boolean>;

  // true mientras se espera la respuesta de la API (deshabilita el botón)
  readonly guardando = signal(false);

  // Mensaje de éxito o error tras guardar (null = no se muestra nada)
  readonly mensaje = signal<MensajeEstado | null>(null);

  // ---------------------------------------------------------------
  // Valores calculados: el rango aceptable y los textos del LED.
  // Se actualizan solos cuando cambia el setpoint o la tolerancia.
  // ---------------------------------------------------------------
  readonly rangoMin = computed(() => this.setpoint() - this.tolerancia());
  readonly rangoMax = computed(() => this.setpoint() + this.tolerancia());

  // Texto del recuadro verde: "24 - 26 °C" (el prototipo muestra "24 - 26 °C")
  readonly textoRango = computed(
    () => `${this.formatear(this.rangoMin())} - ${this.formatear(this.rangoMax())} °C`,
  );

  // Textos de la tarjeta "Colores del LED RGB"
  readonly textoAzul = computed(() => `< ${this.formatear(this.rangoMin())} °C`);
  readonly textoRojo = computed(() => `> ${this.formatear(this.rangoMax())} °C`);

  constructor() {
    const guardada = this.cargarConfig();
    this.setpoint = signal(guardada?.setpoint ?? 25);
    this.tolerancia = signal(guardada?.tolerancia ?? 1);
    this.alertasActivas = signal(guardada?.alertas ?? true);
  }

  // ---------------------------------------------------------------
  // Botones + y -
  // ---------------------------------------------------------------

  aumentarSetpoint(): void {
    this.setpoint.update((valor) =>
      this.limitar(valor + this.SETPOINT_PASO, this.SETPOINT_MIN, this.SETPOINT_MAX),
    );
  }

  disminuirSetpoint(): void {
    this.setpoint.update((valor) =>
      this.limitar(valor - this.SETPOINT_PASO, this.SETPOINT_MIN, this.SETPOINT_MAX),
    );
  }

  aumentarTolerancia(): void {
    this.tolerancia.update((valor) =>
      this.limitar(valor + this.TOLERANCIA_PASO, this.TOLERANCIA_MIN, this.TOLERANCIA_MAX),
    );
  }

  disminuirTolerancia(): void {
    this.tolerancia.update((valor) =>
      this.limitar(valor - this.TOLERANCIA_PASO, this.TOLERANCIA_MIN, this.TOLERANCIA_MAX),
    );
  }

  // Los siguientes métodos le sirven al HTML para deshabilitar un botón
  // cuando ya se llegó al límite (no tiene sentido seguir apretando).
  get setpointEnMinimo(): boolean {
    return this.setpoint() <= this.SETPOINT_MIN;
  }
  get setpointEnMaximo(): boolean {
    return this.setpoint() >= this.SETPOINT_MAX;
  }
  get toleranciaEnMinimo(): boolean {
    return this.tolerancia() <= this.TOLERANCIA_MIN;
  }
  get toleranciaEnMaximo(): boolean {
    return this.tolerancia() >= this.TOLERANCIA_MAX;
  }

  /** Prende o apaga el switch de alertas. */
  alternarAlertas(): void {
    this.alertasActivas.update((activas) => !activas);
  }

  // ---------------------------------------------------------------
  // Guardar: arma el DTO y lo manda a la API
  // ---------------------------------------------------------------

  async guardar(): Promise<void> {
    // Si ya hay un envío en curso, ignoramos clicks repetidos
    if (this.guardando()) return;

    this.mensaje.set(null); // limpiamos el mensaje anterior

    this.guardando.set(true);

    const dto: ConfigDTO = {
      setpoint: this.setpoint(),
      tolerancia: this.tolerancia(),
      alertas: this.alertasActivas(),
    };

    let avisoLocal = '';
    try {
      localStorage.setItem(CLAVE_CONFIGURACION, JSON.stringify(dto));
    } catch {
      avisoLocal = ' El navegador no pudo guardar una copia local.';
    }

    try {
      const texto = await this.termomed.guardarConfig(dto);
      this.mensaje.set({ tipo: 'exito', texto: texto + avisoLocal });
    } catch (error) {
      // El service ya lanza errores con mensaje legible para el usuario
      const texto =
        error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
      const detalleLocal = avisoLocal || ' La configuración quedó guardada en este navegador.';
      this.mensaje.set({ tipo: 'error', texto: texto + detalleLocal });
    } finally {
      // finally se ejecuta siempre (haya error o no): reactivamos el botón
      this.guardando.set(false);
    }
  }

  // ---------------------------------------------------------------
  // Utilidades privadas
  // ---------------------------------------------------------------

  private cargarConfig(): ConfigDTO | null {
    try {
      const datos = localStorage.getItem(CLAVE_CONFIGURACION);
      if (datos === null) return null;

      const guardada: Partial<ConfigDTO> | null = JSON.parse(datos);
      const { setpoint, tolerancia, alertas } = guardada ?? {};
      if (
        typeof setpoint === 'number' &&
        setpoint >= this.SETPOINT_MIN &&
        setpoint <= this.SETPOINT_MAX &&
        typeof tolerancia === 'number' &&
        tolerancia >= this.TOLERANCIA_MIN &&
        tolerancia <= this.TOLERANCIA_MAX &&
        typeof alertas === 'boolean'
      ) {
        return { setpoint, tolerancia, alertas };
      }
    } catch {
      // El navegador puede bloquear el almacenamiento o la copia puede estar dañada.
    }
    return null;
  }

  /** Mantiene un número dentro de [min, max]. */
  private limitar(valor: number, min: number, max: number): number {
    return Math.min(Math.max(valor, min), max);
  }

  /**
   * Formatea un número como en el prototipo:
   * 25 -> "25", 24.5 -> "24,5" (coma decimal, sin ceros de más).
   * Es público porque el HTML también lo usa para mostrar los valores.
   */
  formatear(valor: number): string {
    return String(valor).replace('.', ',');
  }
}
