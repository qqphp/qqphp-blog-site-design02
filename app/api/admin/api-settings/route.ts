import {
  authenticated,
  json,
  readLimitedBody,
  sameOrigin,
} from '@/lib/admin-auth';
import { bindings } from '@/lib/cms-server';

const service = 'artificialanalysis';

async function getStatus() {
  const saved = await bindings()
    .DB.prepare('SELECT api_key FROM api_integration_keys WHERE service = ?')
    .bind(service)
    .first<{ api_key: string }>();
  if (saved?.api_key.trim())
    return { configured: true, source: 'admin' as const };
  if (bindings().AA_API_KEY?.trim())
    return { configured: true, source: 'environment' as const };
  return { configured: false, source: 'missing' as const };
}

export async function GET(request: Request) {
  if (!(await authenticated(request))) return json({ error: '请先登录' }, 401);
  return json({ artificialAnalysis: await getStatus() });
}

export async function PUT(request: Request) {
  if (!sameOrigin(request)) return json({ error: '请求来源无效' }, 403);
  if (!(await authenticated(request))) return json({ error: '请先登录' }, 401);

  let body: { apiKey?: unknown };
  try {
    body = JSON.parse(
      new TextDecoder().decode(await readLimitedBody(request, 8192)),
    );
  } catch {
    return json({ error: '请求格式无效' }, 400);
  }
  if (
    !body ||
    typeof body.apiKey !== 'string' ||
    !body.apiKey.trim() ||
    body.apiKey.trim().length > 4096
  )
    return json({ error: '请填写有效的 API 密钥' }, 400);

  await bindings()
    .DB.prepare(
      `INSERT INTO api_integration_keys (service, api_key, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(service) DO UPDATE SET api_key = excluded.api_key, updated_at = excluded.updated_at`,
    )
    .bind(service, body.apiKey.trim(), new Date().toISOString())
    .run();
  return json({ artificialAnalysis: { configured: true, source: 'admin' } });
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return json({ error: '请求来源无效' }, 403);
  if (!(await authenticated(request))) return json({ error: '请先登录' }, 401);
  await bindings()
    .DB.prepare('DELETE FROM api_integration_keys WHERE service = ?')
    .bind(service)
    .run();
  return json({ artificialAnalysis: await getStatus() });
}
