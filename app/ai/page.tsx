import { SiteFooter, SiteHeader } from '@/components/site-chrome';
import { AiNotebook } from '@/components/ai-notebook';
export const metadata = {
  title: 'AI 实验档案 · 开发阿雷',
  description:
    'AI资讯、Skills 工具箱、中转站和 Token Plan。记录 AI 实践，收集可复用的方法与资源。',
};
export default function AiPage() {
  return (
    <main className="site-shell">
      <SiteHeader />
      <AiNotebook />
      <SiteFooter />
    </main>
  );
}
