import { SiteFooter, SiteHeader } from '@/components/site-chrome';
import { ResearchHub } from '@/components/research-hub';
export const metadata = { title: '投资研究台 · 开发阿雷', description: '趋势分析、策略指标、量化策略与研究复盘的学习笔记。' };
export default function InvestingPage() { return <main className="site-shell"><SiteHeader /><ResearchHub type="investing" /><SiteFooter /></main>; }
