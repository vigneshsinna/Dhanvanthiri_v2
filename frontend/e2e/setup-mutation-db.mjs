import { existsSync, closeSync, openSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const allowMutation = /^(1|true|yes)$/i.test(process.env.E2E_ALLOW_MUTATION || '');
const dbIsDisposable = /^(1|true|yes)$/i.test(process.env.E2E_DB_IS_DISPOSABLE || '');

if (!allowMutation) {
  console.error('Refusing to reset the E2E database without E2E_ALLOW_MUTATION=true.');
  process.exit(1);
}

if (!dbIsDisposable) {
  console.error('Refusing to reset the E2E database without E2E_DB_IS_DISPOSABLE=true.');
  process.exit(1);
}

const testingDatabase = resolve(repoRoot, 'database', 'testing.sqlite');
if (!existsSync(testingDatabase)) {
  closeSync(openSync(testingDatabase, 'w'));
}

const run = (command, args) => {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    env: {
      ...process.env,
      APP_ENV: 'testing',
      DB_CONNECTION: process.env.DB_CONNECTION || 'sqlite',
      DB_DATABASE: process.env.DB_DATABASE || 'database/testing.sqlite',
    },
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

run('composer', ['dump-autoload']);
run('php', [
  'artisan',
  'migrate:fresh',
  '--env=testing',
  '--force',
  '--seed',
  '--seeder=Database\\Seeders\\E2eMutationSeeder',
]);
