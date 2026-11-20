import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CurrentStateDTO } from '../../models/interfaces';
import { TermomedService } from '../../services/termomed.service';
import { estadoActualMock } from './estado-actual.mock';

@Component({
  selector: 'app-inicio',
  standalone: true,
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css',
})
export class InicioComponent implements OnInit {
  private readonly termomed = inject(TermomedService);
  readonly mostrarMock = inject(ActivatedRoute).snapshot.queryParamMap.get('mock') === 'true';
  readonly estado = signal<CurrentStateDTO | null>(null);
  readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    if (this.mostrarMock) {
      this.estado.set(estadoActualMock);
      return;
    }

    try {
      this.estado.set(await this.termomed.obtenerEstadoActual());
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo cargar el estado actual.');
    }
  }
}
