import { SiteFooter, SiteHeader } from '@/components/site-chrome';
import { AiNotebook } from '@/components/ai-notebook';
export const metadata = { title: 'AI 手记 · 开发阿雷', description: '用 AI 做点小东西，记录作品、具体用法与踩坑过程。' };
export default function AiPage() { return <main className="site-shell"><SiteHeader /><AiNotebook /><SiteFooter /></main>; }
