// =====================================================================
// app.component.ts
// Ubicación: src/app/app.component.ts
//
// Componente raíz. Es el "marco" fijo de la app:
//  - <router-outlet>: acá Angular dibuja la pantalla activa
//    (configuración, inicio o historial según la URL).
//  - <app-navbar>: la barra inferior, que queda siempre visible.
// El header NO está incluido a propósito (se arma aparte).
// =====================================================================

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NavbarComponent } from './components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <router-outlet />
    <app-navbar />
  `,
})
export class AppComponent {}
