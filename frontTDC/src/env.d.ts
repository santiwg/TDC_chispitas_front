// =====================================================================
// env.d.ts
// Ubicación: src/env.d.ts
//No tiene valores.
// Le dice a TypeScript qué variables existen en import.meta.env.
// Sin este archivo, config.ts da error de tipos.
// Cada vez que agregues una variable al .env, agregala acá también.
// =====================================================================

declare interface Env {
  readonly NODE_ENV: string;
  readonly NG_APP_API_URL?: string;
  readonly NG_APP_USERS_URL?: string;
}

declare interface ImportMeta {
  readonly env: Env;
}
