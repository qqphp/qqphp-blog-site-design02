import { adminBody, adminRoute, adminSection } from '@/lib/admin-record-route';
import { moveAdminRecord } from '@/lib/admin-records';

type Params = { params: Promise<{ section: string; collection: string; id: string }> };
export async function POST(request: Request, { params }: Params) {
  return adminRoute(request, async () => {
    const { section, collection, id } = await params;
    const { direction, revision } = await adminBody(request);
    return moveAdminRecord({ section: adminSection(section), collection, id }, direction, revision);
  });
}
