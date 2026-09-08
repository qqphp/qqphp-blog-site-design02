'use client';
import { CmsText } from '@/components/cms-text';

import { useContent } from '@/components/content-provider';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


export function LifeNavigation() {
  const life = useContent().site.life.map(item => [item.name, item.href]);
  const path = usePathname();
  return <nav className="life-page-nav" aria-label="生活栏目">{life.map(([name, href]) => <Link key={href} href={href} aria-current={path === href ? 'page' : undefined}>{name}<span aria-hidden="true">↗</span></Link>)}</nav>;
}

export function SiteHeader() {
  const { site } = useContent();
  const links = site.links.map(item => [item.name, item.href]);
  const sites = site.sites.map(item => [item.name, item.href]);
  const life = site.life.map(item => [item.name, item.href]);
  const path = usePathname();
  const inSection = (items: string[][]) => items.some(([, href]) => path === href || path.startsWith(`${href}/`));
  const [fresh, setFresh] = useState(false);
  useEffect(() => { const value = localStorage.getItem('site-theme') === 'fresh'; setFresh(value); document.documentElement.classList.toggle('fresh-theme', value); }, []);
  const setTheme = (value: string) => { const isFresh = value === 'fresh'; setFresh(isFresh); localStorage.setItem('site-theme', isFresh ? 'fresh' : 'default'); document.documentElement.classList.toggle('fresh-theme', isFresh); };
  return <header className="site-header"><Link className="brand" href="/"><span className="brand-mark">{site.mark}</span><span>{site.name}</span></Link><nav>{links.map(([name, href]) => <Link className={path === href || path.startsWith(`${href}/`) ? 'active' : ''} href={href} key={href}>{name}</Link>)}<Sheet><SheetTrigger className={`nav-drawer-trigger${inSection(sites) ? ' active' : ''}`} aria-current={inSection(sites) ? 'true' : undefined}><span>+</span> 网站</SheetTrigger><SheetContent className="life-drawer"><SheetTitle><CmsText page="导航菜单" name="01 网站索引" /></SheetTitle><div>{sites.map(([name, href], index) => <Link href={href} key={href}><span>0{index + 1}</span><b>{name}</b><i>↗</i></Link>)}</div></SheetContent></Sheet><Sheet><SheetTrigger className={`nav-drawer-trigger${inSection(life) ? ' active' : ''}`} aria-current={inSection(life) ? 'true' : undefined}><span>+</span> 生活</SheetTrigger><SheetContent className="life-drawer"><SheetTitle><CmsText page="导航菜单" name="02 生活索引" /></SheetTitle><div>{life.map(([name, href], index) => <Link href={href} key={href}><span>0{index + 1}</span><b>{name}</b><i>↗</i></Link>)}</div></SheetContent></Sheet></nav><DropdownMenu><DropdownMenuTrigger className="theme-toggle"><span className="theme-icon">{fresh ? '☼' : '☾'}</span>{fresh ? '清风' : '明月'}</DropdownMenuTrigger><DropdownMenuContent align="end" className="theme-menu"><DropdownMenuRadioGroup value={fresh ? 'fresh' : 'default'} onValueChange={setTheme}><DropdownMenuRadioItem value="fresh"><span className="theme-option-icon">☼</span>清风</DropdownMenuRadioItem><DropdownMenuRadioItem value="default"><span className="theme-option-icon">☾</span>明月</DropdownMenuRadioItem></DropdownMenuRadioGroup></DropdownMenuContent></DropdownMenu></header>;
}

export function SiteFooter() { const { site } = useContent(); return <footer className="site-footer"><p>{site.footer}</p><Link href={site.footerUrl}>{site.footerLink}</Link><small>{site.copyright}</small></footer>; }
export function PageIntro({ title, text }: { title: string; text: string }) {
  const path = usePathname();
  const { pageSettings } = useContent();
  const page = path === '/writing' ? pageSettings.writing : path === '/projects' ? pageSettings.projects : { title, text };
  return <section className="page-intro"><h1>{page.title}</h1><p>{page.text}</p></section>;
}
