import { sites } from '@openai/sites-vite-plugin';
import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig, type ViteDevServer } from 'vite';
import { startAiTransport } from './scripts/local-ai-transport.mjs';
import { startLocalMediaStorage } from './scripts/local-media-storage.mjs';
import { ensureManagedPostgres } from './scripts/managed-postgres.mjs';

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === 'seatbelt';

const localBindingConfig = {
  main: 'vinext/server/fetch-handler',
  compatibility_flags: ['nodejs_compat'],
};

export default defineConfig(async ({ command }) => {
  if (command === 'serve') await ensureManagedPostgres();
  const transport = command === 'serve' ? await startAiTransport() : undefined;
  const mediaStorage =
    command === 'serve' ? await startLocalMediaStorage() : undefined;
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= 'false';
  process.env.WRANGLER_LOG_PATH ??= '.wrangler/logs';
  process.env.MINIFLARE_REGISTRY_PATH ??= '.wrangler/registry';

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import('@cloudflare/vite-plugin');

  return {
    css: { postcss: { plugins: [tailwindcss()] } },
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: [
      {
        name: 'local-ai-transport',
        configureServer(server: ViteDevServer) {
          server.httpServer?.once('close', () => {
            void transport?.close();
            void mediaStorage?.close();
          });
        },
      },
      vinext(),
      sites(),
      cloudflare({
        persistState: process.env.CMS_TEST_STATE
          ? { path: process.env.CMS_TEST_STATE }
          : true,
        viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
        config: {
          ...localBindingConfig,
          vars: {
            ...transport?.vars,
            ...mediaStorage?.vars,
            ...(process.env.DATABASE_URL ? { DATABASE_URL: process.env.DATABASE_URL } : {}),
          },
        },
      }),
    ],
  };
});
