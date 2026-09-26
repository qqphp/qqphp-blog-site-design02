import { SiteFooter, SiteHeader } from '@/components/site-chrome';
import { AiNotebook } from '@/components/ai-notebook';
import { SectionContent } from '@/components/section-content';
export const metadata = {
  title: 'AI 实验档案 · 开发阿雷',
  description:
    '大模型数据、智能体、技能与中转站 API。记录 AI 实践，收集可复用的方法与资源。',
};
export default function AiPage() {
  return (
    <SectionContent sections={['aiNotes', 'prompt']}><main className="site-shell">
      <SiteHeader />
      <AiNotebook />
      <SiteFooter />
    </main></SectionContent>
  );
}
