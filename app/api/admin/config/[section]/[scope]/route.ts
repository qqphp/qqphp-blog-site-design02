import { adminBody, adminRoute, adminSection } from '@/lib/admin-record-route';
import { getAdminConfig, saveAdminConfig } from '@/lib/admin-records';

type Params = { params: Promise<{ section: string; scope: string }> };
export async function GET(request: Request, { params }: Params) {
  return adminRoute(request, async () => {
    const { section, scope } = await params;
    return getAdminConfig(adminSection(section), scope);
  });
}
export async function PUT(request: Request, { params }: Params) {
  return adminRoute(request, async () => {
    const { section, scope } = await params;
    const { value, revision } = await adminBody(request);
    return saveAdminConfig(adminSection(section), scope, value, revision);
  });
}
