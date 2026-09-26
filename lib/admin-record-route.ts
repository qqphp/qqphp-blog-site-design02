import { authenticated, json, readLimitedBody, sameOrigin } from './admin-auth';
import { AdminConflict, AdminNotFound } from './admin-records';
import { isSection } from './cms-validation';
import type { Section } from './cms-defaults';

export async function adminRoute<T>(request: Request, work: () => Promise<T>) {
  if (request.method !== 'GET' && !sameOrigin(request))
    return json({ error: '请求来源无效' }, 403);
  if (!(await authenticated(request))) return json({ error: '请先登录' }, 401);
  try {
    return json(await work());
  } catch (error) {
    const status = error instanceof AdminConflict ? 409
      : error instanceof AdminNotFound ? 404
        : error instanceof RangeError ? 413 : 400;
    return json({ error: error instanceof Error ? error.message : '操作失败' }, status);
  }
}

export async function adminBody(request: Request) {
  return JSON.parse(new TextDecoder().decode(await readLimitedBody(request, 2_000_000)));
}

export function adminSection(value: string): Section {
  if (!isSection(value)) throw new Error('栏目无效');
  return value;
}
