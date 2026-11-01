// =====================================================================
// config.ts
// Ubicación: src/app/config/config.ts
//
// Es el archivo que importa el axiosClient (import { config } from
// '../config/config'). Acá se centralizan las variables de entorno,
// así el resto de la app NUNCA lee import.meta.env directamente:
// si algún día cambia la forma de leer el entorno, se toca un solo archivo.
//
// Cómo funciona:
// Angular no trae soporte de .env por defecto. Usamos el paquete
// @ngx-env/builder, que lee el archivo .env y expone las variables
// que empiezan con NG_APP_ en import.meta.env.
// (Los pasos de instalación están en el mensaje de entrega.)
// =====================================================================

const env = import.meta.env;

// Valor por defecto para desarrollo local, por si falta el .env
const URL_POR_DEFECTO = 'http://localhost:3000';//SACAR ESTO

/** Saca las barras del final para evitar URLs con doble barra ("//config"). */
const limpiarUrl = (url: string): string => url.replace(/\/+$/, '');

// Si falta la variable avisamos por consola para detectarlo rápido
if (!env.NG_APP_API_URL) {
  console.warn(
    `[config] Falta NG_APP_API_URL en el .env, se usa ${URL_POR_DEFECTO}`,
  );
}

export const config = {
  urls: {
    // URL base de la API del termómetro (POST /config, GET /currentState, GET /historial)
    api: limpiarUrl(env.NG_APP_API_URL ?? URL_POR_DEFECTO),

    // La usa el interceptor de refresh-token del axiosClient.
    // Si no hay login ni usuarios en este proyecto, se puede borrar
    // junto con ese bloque del interceptor.
    /*
    users: limpiarUrl(
      env.NG_APP_USERS_URL ?? env.NG_APP_API_URL ?? URL_POR_DEFECTO,
    ),
    LO DEJO COMENTADO POR SI DESPUES LO USAMOS*/
  },
};
