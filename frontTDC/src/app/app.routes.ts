// =====================================================================
// app.routes.ts
// Ubicación: src/app/app.routes.ts
//
// Define qué pantalla se muestra en cada URL.
// Usamos loadComponent (carga diferida): cada pantalla se descarga
// solo cuando el usuario entra por primera vez, lo que achica
// el tamaño inicial de la app.
// =====================================================================

import { Routes } from '@angular/router';

export const routes: Routes = [
  // Al entrar a la raíz ("/") redirigimos a Inicio.
  // pathMatch: 'full' hace que solo aplique si la URL es EXACTAMENTE vacía.
  { path: '', redirectTo: 'configuracion', pathMatch: 'full' },
//CAMBIAR PARA QUE REDIRIJA A INICIO
  {
    path: 'configuracion',
    loadComponent: () =>
      import('./pages/configuracion/configuracion.component').then(
        (m) => m.ConfiguracionComponent,
      ),
  },

  /* PENDIENTE: estas dos pantallas todavía hay que crearlas.
   Hasta que existan, comentá estas rutas para que compile.
  {
    path: 'inicio',
    loadComponent: () =>
      import('./pages/inicio/inicio.component').then((m) => m.InicioComponent),
  },
  {
    path: 'historial',
    loadComponent: () =>
      import('./pages/historial/historial.component').then(
        (m) => m.HistorialComponent,
      ),
  },

  // Cualquier URL que no exista vuelve a Inicio
  { path: '**', redirectTo: 'inicio' },*/
];
