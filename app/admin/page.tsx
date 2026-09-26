import { AdminGranularPanel } from '@/components/admin-granular-panel';
import '@/components/admin.css';

export const metadata = {
  title: '内容管理 · 开发阿雷',
  robots: { index: false, follow: false },
};
export default function AdminPage() {
  return <AdminGranularPanel />;
}
