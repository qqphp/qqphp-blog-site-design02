import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fetch, EnvHttpProxyAgent } from 'undici';

// workerd does not inherit HTTP_PROXY. A loopback-only transport lets local
// AI requests use Node's proxy agent without moving credentials into the browser.
/** @returns {Promise<{vars: Record<string, string>, close: () => Promise<void>}>} */
export async function startAiTransport() {
  if (
    !process.env.HTTPS_PROXY &&
    !process.env.https_proxy &&
    !process.env.HTTP_PROXY &&
    !process.env.http_proxy
  )
    return { vars: {}, close: async () => {} };
  const token = randomBytes(32).toString('hex');
  const dispatcher = new EnvHttpProxyAgent();
  const server = createServer(async (request, response) => {
    if (request.headers['x-local-ai-token'] !== token) {
      response.writeHead(403).end();
      return;
    }
    try {
      const target = new URL(String(request.headers['x-local-ai-target']));
      if (
        target.protocol !== 'https:' ||
        target.username ||
        target.password ||
        !target.hostname.includes('.') ||
        /^(\d|\[)/.test(target.hostname) ||
        /\.(localhost|local|internal)$/.test(target.hostname) ||
        !['GET', 'POST'].includes(request.method)
      ) {
        response.writeHead(400).end();
        return;
      }
      const chunks = [];
      let size = 0;
      for await (const chunk of request) {
        size += chunk.length;
        if (size > 1024 * 1024) {
          response.writeHead(413).end();
          return;
        }
        chunks.push(chunk);
      }
      const controller = new AbortController();
      response.on('close', () => controller.abort());
      const upstream = await fetch(target, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          ...(request.headers.authorization
            ? { Authorization: request.headers.authorization }
            : {}),
        },
        body: request.method === 'POST' ? Buffer.concat(chunks) : undefined,
        dispatcher,
        redirect: 'manual',
        signal: AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(300000),
        ]),
      });
      response.writeHead(upstream.status, {
        'Content-Type':
          upstream.headers.get('content-type') || 'application/octet-stream',
      });
      if (upstream.body)
        await pipeline(Readable.fromWeb(upstream.body), response);
      else response.end();
    } catch {
      if (!response.headersSent) response.writeHead(502);
      response.end();
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  server.unref();
  return {
    vars: {
      LOCAL_AI_TRANSPORT: `http://127.0.0.1:${server.address().port}`,
      LOCAL_AI_TOKEN: token,
    },
    close: async () => {
      server.closeAllConnections();
      server.close();
      await dispatcher.close();
    },
  };
}
