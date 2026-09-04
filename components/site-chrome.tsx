'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const links = [['写作', '/writing'], ['项目', '/projects'], ['说说', '/notes'], ['AI', '/ai'], ['投资', '/investing'], ['关于', '/about']];
const life = [['音乐', '/music'], ['电影', '/films'], ['播客', '/podcasts'], ['旅行', '/travel'], ['爱好', '/hobbies']];

export function SiteHeader() {
  const path = usePathname();
  const [fresh, setFresh] = useState(() => typeof document !== 'undefined' && document.documentElement.classList.contains('fresh-theme'));
  useEffect(() => { const value = localStorage.getItem('site-theme') === 'fresh'; setFresh(value); document.documentElement.classList.toggle('fresh-theme', value); }, []);
  const setTheme = (value: string) => { const isFresh = value === 'fresh'; setFresh(isFresh); localStorage.setItem('site-theme', isFresh ? 'fresh' : 'default'); document.documentElement.classList.toggle('fresh-theme', isFresh); };
  return <header className="site-header"><Link className="brand" href="/"><span className="brand-mark">A</span><span>开发阿雷</span></Link><nav>{links.map(([name, href]) => <Link className={path === href ? 'active' : ''} href={href} key={href}>{name}</Link>)}<Sheet><SheetTrigger className="nav-drawer-trigger"><span>+</span> 网站</SheetTrigger><SheetContent className="life-drawer"><SheetTitle>网站索引</SheetTitle><div>{[['书签', '/bookmarks'], ['友链', '/friends']].map(([name, href], index) => <Link href={href} key={href}><span>0{index + 1}</span><b>{name}</b><i>↗</i></Link>)}</div></SheetContent></Sheet><Sheet><SheetTrigger className="nav-drawer-trigger"><span>+</span> 生活</SheetTrigger><SheetContent className="life-drawer"><SheetTitle>生活索引</SheetTitle><div>{life.map(([name, href], index) => <Link href={href} key={href}><span>0{index + 1}</span><b>{name}</b><i>↗</i></Link>)}</div></SheetContent></Sheet></nav><DropdownMenu><DropdownMenuTrigger className="theme-toggle"><span>{fresh ? '☼' : '☾'}</span>{fresh ? '清风' : '明月'}<i>⌄</i></DropdownMenuTrigger><DropdownMenuContent align="end" className="theme-menu"><DropdownMenuRadioGroup value={fresh ? 'fresh' : 'default'} onValueChange={setTheme}><DropdownMenuRadioItem value="fresh">☼ 清风</DropdownMenuRadioItem><DropdownMenuRadioItem value="default">☾ 明月</DropdownMenuRadioItem></DropdownMenuRadioGroup></DropdownMenuContent></DropdownMenu></header>;
}

export function SiteFooter() { return <footer className="site-footer"><p>保持好奇，缓慢积累。</p><a href="mailto:hello@example.com">hello@example.com ↗</a><small>© 2026 · 开发阿雷</small></footer>; }
export function PageIntro({ title, text }: { title: string; text: string }) { return <section className="page-intro"><h1>{title}</h1><p>{text}</p></section>; }
