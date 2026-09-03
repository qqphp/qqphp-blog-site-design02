'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const links = [['写作', '/writing'], ['项目', '/projects'], ['说说', '/notes'], ['AI', '/ai'], ['投资', '/investing'], ['关于', '/about']];

export function SiteHeader() {
  const pathname = usePathname();
  const [fresh, setFresh] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => { const saved = window.localStorage.getItem('site-theme'); setFresh(saved === 'fresh'); setReady(true); }, []);
  useEffect(() => { if (!ready) return; document.documentElement.classList.toggle('fresh-theme', fresh); window.localStorage.setItem('site-theme', fresh ? 'fresh' : 'default'); }, [fresh, ready]);
  return <header className="site-header"><Link className="brand" href="/"><span className="brand-mark">A</span><span>你的名字</span></Link><nav aria-label="主导航">{links.map(([label, href]) => <Link className={pathname === href ? 'active' : ''} href={href} key={href}>{label}</Link>)}<details className="nav-sites"><summary className={pathname === '/bookmarks' || pathname === '/friends' ? 'active' : ''}>网站</summary><div><Link href="/bookmarks">书签</Link><Link href="/friends">友链</Link></div></details></nav><button className="theme-toggle" type="button" aria-label="切换清新网格主题" onClick={() => setFresh(!fresh)}><span>☼</span> 主题</button></header>;
}

export function SiteFooter() { return <footer className="site-footer"><p>保持好奇，缓慢积累。</p><a href="mailto:hello@example.com">hello@example.com ↗</a><small>© 2026 · 你的名字</small></footer>; }
export function PageIntro({ title, text }: { title: string; text: string }) { return <section className="page-intro"><h1>{title}</h1><p>{text}</p></section>; }
