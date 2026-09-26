import { getStoryArchive } from '@/lib/cms-server';
import { json } from '@/lib/admin-auth';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page') ?? 1);
  const rawPeriod = url.searchParams.get('period');
  const period = rawPeriod === null ? undefined : Number(rawPeriod);
  if (!Number.isInteger(page) || page < 1 || page > 10000 ||
      (period !== undefined && (!Number.isInteger(period) || period < 1900 * 12 || period > 2200 * 12)))
    return json({ error: '查询条件无效' }, 400);
  return json(await getStoryArchive(page, period));
}
