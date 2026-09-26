import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { copyFile } from 'node:fs/promises';
import { startAiTransport } from './local-ai-transport.mjs';
import { startLocalMediaStorage } from './local-media-storage.mjs';
import { ensureManagedPostgres } from './managed-postgres.mjs';
import { restrictSecretFile } from './secret-permissions.mjs';

await ensureManagedPostgres();
const transport = await startAiTransport();
const mediaStorage = await startLocalMediaStorage();
const localVariables = { ...transport.vars, ...mediaStorage.vars };

// Wrangler loads local secrets beside its generated config, not beside the project.
await copyFile(resolve('.dev.vars'), resolve('dist/server/.dev.vars'));
restrictSecretFile(resolve('dist/server/.dev.vars'));

// The built preview reads the same local PostgreSQL connection and admin password.
const child = spawn(
  process.execPath,
  [
    resolve('node_modules/wrangler/bin/wrangler.js'),
    'dev',
    '--config',
    resolve('dist/server/wrangler.json'),
    ...Object.entries(localVariables).flatMap(([key, value]) => [
      '--var',
      `${key}:${value}`,
    ]),
    ...process.argv.slice(2),
  ],
  { stdio: 'inherit' },
);
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
child.on('error', (error) => {
  void transport.close();
  void mediaStorage.close();
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', (code) => {
  void transport.close();
  void mediaStorage.close();
  process.exitCode = code ?? 1;
});
