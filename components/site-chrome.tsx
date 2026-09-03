'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const links = [['写作', '/writing'], ['项目', '/projects'], ['说说', '/notes'], ['AI', '/ai'], ['投资', '/investing'], ['关于', '/about']];

export function SiteHeader() {
  const pathname = usePathname();
  const [fresh, setFresh] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => { const saved = window.localStorage.getItem('site-theme'); setFresh(saved === 'fresh'); setReady(true); }, []);
  useEffect(() => { if (!ready) return; document.documentElement.classList.toggle('fresh-theme', fresh); window.localStorage.setItem('site-theme', fresh ? 'fresh' : 'default'); }, [fresh, ready]);
  return <header className="site-header"><Link className="brand" href="/"><span className="brand-mark">A</span><span>你的名字</span></Link><nav aria-label="主导航">{links.map(([label, href]) => <Link className={pathname === href ? 'active' : ''} href={href} key={href}>{label}</Link>)}<Sheet><SheetTrigger className={`nav-drawer-trigger ${pathname === '/bookmarks' || pathname === '/friends' ? 'active' : ''}`} aria-label="打开网站菜单"><span>+</span> 网站</SheetTrigger><SheetContent className="life-drawer"><SheetTitle>网站索引</SheetTitle><p>收藏值得反复打开的资料，也连接仍在认真写作的人。</p><div>{[['书签', '/bookmarks', '像浏览器收藏夹一样整理'], ['友链', '/friends', '正在阅读与推荐的个人网站']].map(([label, href, note], index) => <Link href={href} key={href}><span>0{index + 1}</span><b>{label}</b><em>{note}</em><i>↗</i></Link>)}</div></SheetContent></Sheet><Sheet><SheetTrigger className="nav-drawer-trigger" aria-label="打开生活菜单"><span>+</span> 生活</SheetTrigger><SheetContent className="life-drawer"><SheetTitle>生活索引</SheetTitle><p>不只是工作的另一面，也是持续感受世界的方式。</p><div>{[['音乐', '/music', '正在循环的声音'], ['电影', '/films', '银幕留下的余光'], ['播客', '/podcasts', '值得慢慢听完的对话'], ['旅行', '/travel', '在路上的坐标'], ['爱好', '/hobbies', '不为效率的练习']].map(([label, href, note], index) => <Link href={href} key={href}><span>0{index + 1}</span><b>{label}</b><em>{note}</em><i>↗</i></Link>)}</div></SheetContent></Sheet></nav><button className="theme-toggle" type="button" aria-label="切换清新网格主题" onClick={() => setFresh(!fresh)}><span>☼</span> 主题</button></header>;
}

export function SiteFooter() { return <footer className="site-footer"><p>保持好奇，缓慢积累。</p><a href="mailto:hello@example.com">hello@example.com ↗</a><small>© 2026 · 你的名字</small></footer>; }
export function PageIntro({ title, text }: { title: string; text: string }) { return <section className="page-intro"><h1>{title}</h1><p>{text}</p></section>; }
