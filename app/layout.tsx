import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { MusicProvider } from '@/components/music-player';
import '@/components/life.css';

export const metadata: Metadata = {
  title: '开发阿雷 · 个人工作站',
  description: '写作、项目与持续生长的工作档案。',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN" suppressHydrationWarning><head><Script id="theme-preference" strategy="beforeInteractive">{`try { if (localStorage.getItem('site-theme') === 'fresh') document.documentElement.classList.add('fresh-theme'); } catch (_) {}`}</Script></head><body><MusicProvider>{children}</MusicProvider></body></html>;
}
