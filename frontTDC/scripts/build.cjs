const { spawnSync } = require('node:child_process');

const apiUrl = process.env.NG_APP_API_URL?.trim();

if (process.env.VERCEL === '1' && !apiUrl) {
  console.error('Configurá NG_APP_API_URL en el entorno de este despliegue de Vercel.');
  process.exit(1);
}

const args = [require.resolve('@angular/cli/bin/ng.js'), 'build', ...process.argv.slice(2)];

if (apiUrl) {
  args.push('--define', `import.meta.env=${JSON.stringify({ NG_APP_API_URL: apiUrl })}`);
}

const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
if (result.error) throw result.error;

process.exitCode = result.status ?? 1;
