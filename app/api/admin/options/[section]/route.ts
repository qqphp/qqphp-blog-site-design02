import { adminRoute, adminSection } from '@/lib/admin-record-route';
import { getAdminOptions } from '@/lib/admin-records';

export async function GET(request: Request, { params }: { params: Promise<{ section: string }> }) {
  return adminRoute(request, async () => getAdminOptions(adminSection((await params).section)));
}
