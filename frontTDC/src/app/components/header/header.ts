// =====================================================================
// header.component.ts
// Ubicación sugerida: src/app/components/header/header.component.ts
//
// Barra superior con el logo (termómetro) y el nombre "TermoMed".
// Se usa una sola vez, en el layout principal (app.html):
//   <app-header />
// =====================================================================

import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {}