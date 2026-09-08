import { bindings } from '@/lib/cms-server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  if (!/^[a-f0-9-]+\.(png|jpg|gif|webp|mp3|wav)$/.test(key))
    return new Response('Not found', { status: 404 });
  const file = await bindings().MEDIA.get(key, {
    range: request.headers.has('range') ? request.headers : undefined,
    onlyIf: request.headers.has('if-none-match') ? request.headers : undefined,
  });
  if (!file) return new Response('Not found', { status: 404 });
  const headers = new Headers({
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
    'Accept-Ranges': 'bytes',
  });
  file.writeHttpMetadata(headers);
  headers.set('ETag', file.httpEtag);
  if (!('body' in file)) return new Response(null, { status: 304, headers });
  if (
    request.headers.has('range') &&
    file.range &&
    'offset' in file.range &&
    'length' in file.range
  ) {
    const { offset, length } = file.range as { offset: number; length: number };
    headers.set(
      'Content-Range',
      `bytes ${offset}-${offset + length - 1}/${file.size}`,
    );
    headers.set('Content-Length', String(length));
    return new Response(file.body, { status: 206, headers });
  }
  headers.set('Content-Length', String(file.size));
  return new Response(file.body, { headers });
}
