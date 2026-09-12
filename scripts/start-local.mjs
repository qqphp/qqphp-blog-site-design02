import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { startAiTransport } from './local-ai-transport.mjs';
import { startLocalMediaStorage } from './local-media-storage.mjs';

const transport = await startAiTransport();
const mediaStorage = await startLocalMediaStorage();
const localVariables = { ...transport.vars, ...mediaStorage.vars };

// Absolute paths make the built preview share the development database and secrets.
const child = spawn(
  process.execPath,
  [
    resolve('node_modules/wrangler/bin/wrangler.js'),
    'dev',
    '--config',
    resolve('dist/server/wrangler.json'),
    '--persist-to',
    resolve('.wrangler/state'),
    '--env-file',
    resolve('.dev.vars'),
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
