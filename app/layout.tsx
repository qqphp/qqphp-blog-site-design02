import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '开发阿雷 · 个人工作站',
  description: '写作、项目与持续生长的工作档案。',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
