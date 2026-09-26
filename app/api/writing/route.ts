import { getWritingArchive } from '@/lib/cms-server';
import { json } from '@/lib/admin-auth';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') ?? '';
  const group = url.searchParams.get('group') ?? '';
  const page = Number(url.searchParams.get('page') ?? 1);
  if (query.length > 100 || group.length > 200 || !Number.isInteger(page) || page < 1 || page > 10000)
    return json({ error: '搜索条件无效' }, 400);
  return json(await getWritingArchive(query, group, page));
}
