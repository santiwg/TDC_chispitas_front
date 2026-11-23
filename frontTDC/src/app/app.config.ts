// =====================================================================
// app.config.ts
// Ubicación: src/app/app.config.ts
//
// Configuración global de la app. Lo único que necesitamos es
// registrar el router con las rutas de app.routes.ts.
// (Si tu proyecto ya trae este archivo, solo verificá que tenga provideRouter.)
// =====================================================================

import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes)],
};
