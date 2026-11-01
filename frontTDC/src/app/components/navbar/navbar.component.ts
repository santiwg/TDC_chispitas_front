// =====================================================================
// navbar.component.ts
// Ubicación: src/app/components/navbar/navbar.component.ts
//
// Barra de navegación inferior con 3 pestañas.
// No tiene lógica propia: Angular se encarga de todo con dos directivas:
//  - routerLink: navega a la ruta al hacer click.
//  - routerLinkActive: agrega la clase "activo" a la pestaña
//    cuyo link coincide con la URL actual (así se pinta de azul claro).
// =====================================================================

import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {}
