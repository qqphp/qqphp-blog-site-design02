import { SiteFooter, SiteHeader } from '@/components/site-chrome';
import { AboutProfile } from '@/components/about-profile';

export const metadata = { title: '关于 · 开发阿雷', description: '用代码做点东西，用文字留住过程。认识开发阿雷，发现创作、兴趣与技术服务。' };

export default function AboutPage() {
  return <main className="site-shell"><SiteHeader /><AboutProfile /><SiteFooter /></main>;
}
