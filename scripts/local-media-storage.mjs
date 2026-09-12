import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import {
  mkdir,
  readFile,
  readdir,
  rename,
  stat,
  writeFile,
} from 'node:fs/promises';
import { resolve } from 'node:path';

const keyPattern = /^[a-f0-9-]+\.(png|jpg|gif|webp|mp3|wav)$/;
const contentTypes = {
  png: 'image/png',
  jpg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
};

function sendJson(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(value));
}

async function readBody(request, maximum) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maximum) throw new RangeError('File is too large');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function parseRange(value, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value || '');
  if (!match || (!match[1] && !match[2])) return null;
  let start;
  let end;
  if (!match[1]) {
    const length = Number(match[2]);
    if (!Number.isSafeInteger(length) || length <= 0) return null;
    start = Math.max(0, size - length);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
  }
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < 0 ||
    start >= size ||
    end < start
  )
    return null;
  return { start, end: Math.min(end, size - 1) };
}

async function readMetadata(metadataDirectory, key) {
  try {
    return JSON.parse(
      await readFile(resolve(metadataDirectory, `${key}.json`), 'utf8'),
    );
  } catch {
    return {};
  }
}

/**
 * Starts a loopback-only file service so the local Worker runtime can use the
 * host filesystem without an R2 binding.
 * @returns {Promise<{vars: Record<string, string>, directory: string, close: () => Promise<void>}>}
 */
export async function startLocalMediaStorage() {
  const directory = resolve(process.env.CMS_MEDIA_DIRECTORY || '.local/media');
  const metadataDirectory = resolve(directory, '.metadata');
  await mkdir(metadataDirectory, { recursive: true });
  const token = randomBytes(32).toString('hex');
  const server = createServer(async (request, response) => {
    if (request.headers['x-local-media-token'] !== token) {
      response.writeHead(403).end();
      return;
    }
    try {
      const url = new URL(request.url || '/', 'http://localhost');
      if (url.pathname === '/media' && request.method === 'GET') {
        const offsetText = url.searchParams.get('cursor') || '0';
        if (!/^\d+$/.test(offsetText)) {
          sendJson(response, 400, { error: 'Invalid cursor' });
          return;
        }
        const offset = Number(offsetText);
        const keys = (await readdir(directory, { withFileTypes: true }))
          .filter((entry) => entry.isFile() && keyPattern.test(entry.name))
          .map((entry) => entry.name);
        const files = await Promise.all(
          keys.map(async (key) => {
            const [details, metadata] = await Promise.all([
              stat(resolve(directory, key)),
              readMetadata(metadataDirectory, key),
            ]);
            return {
              key,
              name:
                typeof metadata.name === 'string' && metadata.name
                  ? metadata.name
                  : key,
              size: details.size,
              modified: details.mtimeMs,
            };
          }),
        );
        files.sort(
          (left, right) =>
            right.modified - left.modified || left.key.localeCompare(right.key),
        );
        const page = files.slice(offset, offset + 100);
        sendJson(response, 200, {
          files: page.map(({ modified: _modified, ...file }) => file),
          cursor:
            offset + page.length < files.length
              ? String(offset + page.length)
              : null,
        });
        return;
      }
      const key = decodeURIComponent(url.pathname.slice('/media/'.length));
      if (!url.pathname.startsWith('/media/') || !keyPattern.test(key)) {
        response.writeHead(404).end();
        return;
      }
      const path = resolve(directory, key);
      if (request.method === 'PUT') {
        const data = await readBody(request, 20 * 1024 * 1024);
        if (!data.length) {
          response.writeHead(400).end();
          return;
        }
        const extension = key.split('.').at(-1);
        const contentType = contentTypes[extension];
        if (request.headers['content-type'] !== contentType) {
          response.writeHead(400).end();
          return;
        }
        let name = key;
        try {
          name = decodeURIComponent(
            String(request.headers['x-media-name'] || key),
          ).slice(0, 200);
        } catch {
          /* Keep the generated key as a safe display name. */
        }
        const temporary = resolve(
          directory,
          `.${key}.${randomBytes(8).toString('hex')}.tmp`,
        );
        await writeFile(temporary, data);
        await rename(temporary, path);
        await writeFile(
          resolve(metadataDirectory, `${key}.json`),
          JSON.stringify({
            name,
            contentType,
            source:
              request.headers['x-media-source'] === 'ai' ? 'ai' : 'upload',
          }),
        );
        response.writeHead(201).end();
        return;
      }
      if (request.method === 'GET') {
        let details;
        try {
          details = await stat(path);
        } catch (error) {
          if (error?.code === 'ENOENT') {
            response.writeHead(404).end();
            return;
          }
          throw error;
        }
        if (!details.isFile()) {
          response.writeHead(404).end();
          return;
        }
        const etag = `"${details.size.toString(16)}-${Math.trunc(details.mtimeMs).toString(16)}"`;
        const extension = key.split('.').at(-1);
        const headers = {
          'Content-Type': contentTypes[extension],
          'Accept-Ranges': 'bytes',
          ETag: etag,
        };
        if (request.headers['if-none-match'] === etag) {
          response.writeHead(304, headers).end();
          return;
        }
        const data = await readFile(path);
        if (request.headers.range) {
          const range = parseRange(request.headers.range, data.length);
          if (!range) {
            response
              .writeHead(416, {
                ...headers,
                'Content-Range': `bytes */${data.length}`,
              })
              .end();
            return;
          }
          const body = data.subarray(range.start, range.end + 1);
          response.writeHead(206, {
            ...headers,
            'Content-Length': body.length,
            'Content-Range': `bytes ${range.start}-${range.end}/${data.length}`,
          });
          response.end(body);
          return;
        }
        response.writeHead(200, {
          ...headers,
          'Content-Length': data.length,
        });
        response.end(data);
        return;
      }
      response.writeHead(405).end();
    } catch (error) {
      if (error instanceof RangeError) response.writeHead(413).end();
      else response.writeHead(500).end();
    }
  });
  await new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  server.unref();
  return {
    vars: {
      LOCAL_MEDIA_STORAGE: `http://127.0.0.1:${server.address().port}`,
      LOCAL_MEDIA_TOKEN: token,
    },
    directory,
    close: async () => {
      server.closeAllConnections();
      await new Promise((resolveClose) => server.close(resolveClose));
    },
  };
}
