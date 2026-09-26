import { adminBody, adminRoute, adminSection } from '@/lib/admin-record-route';
import { AdminNotFound, deleteAdminRecord, getAdminRecord, setAdminPublication, updateAdminRecord } from '@/lib/admin-records';

type Params = { params: Promise<{ section: string; collection: string; id: string }> };
export async function GET(request: Request, { params }: Params) {
  return adminRoute(request, async () => {
    const { section, collection, id } = await params;
    const result = await getAdminRecord({ section: adminSection(section), collection, id });
    if (!result) throw new AdminNotFound('记录不存在');
    return result;
  });
}
export async function PUT(request: Request, { params }: Params) {
  return adminRoute(request, async () => {
    const { section, collection, id } = await params;
    const { value, revision } = await adminBody(request);
    return updateAdminRecord({ section: adminSection(section), collection, id }, value, revision);
  });
}
export async function PATCH(request: Request, { params }: Params) {
  return adminRoute(request, async () => {
    const { section, collection, id } = await params;
    const { published, revision } = await adminBody(request);
    return setAdminPublication({ section: adminSection(section), collection, id }, published, revision);
  });
}
export async function DELETE(request: Request, { params }: Params) {
  return adminRoute(request, async () => {
    const { section, collection, id } = await params;
    const { revision } = await adminBody(request);
    return deleteAdminRecord({ section: adminSection(section), collection, id }, revision);
  });
}
