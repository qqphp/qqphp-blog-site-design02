import Link from 'next/link';
import { projects, writing } from './content';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';

export default function Home() {
  return <main className="site-shell"><SiteHeader />
    <section className="hero" id="top"><p className="eyebrow">PERSONAL WORKSTATION / 2026</p><h1>思考、制作，<br />并留下值得回看的东西。</h1><div className="hero-bottom"><p>这里存放我的写作、项目与尚未成形的灵感。<br />欢迎从最近的更新开始。</p><Link className="round-link" href="/writing" aria-label="查看最近更新">↓</Link></div><div className="orb orb-one" /><div className="orb orb-two" /></section>
    <section className="latest"><div className="section-label"><span>01</span> 最近更新</div><div className="entry-list">{writing.slice(0, 3).map((entry) => <Link className="entry" href="/writing" key={entry.title}><span className="entry-meta">{entry.label} · {entry.date.slice(5)}</span><div><h2>{entry.title}</h2><p>{entry.excerpt}</p></div><span className="entry-arrow">↗</span></Link>)}<Link className="more-row" href="/writing">查看全部写作 <span>→</span></Link></div></section>
    <section className="home-projects"><div className="home-project-head"><p className="eyebrow">SELECTED WORK</p><Link href="/projects">全部项目 →</Link></div><div className="project-shelf">{projects.slice(0, 2).map((project) => <Link className={`shelf-card ${project.color}`} href="/projects" key={project.title}><div className="shelf-art"><b>{project.number}</b><em /></div><p>{project.category}</p><h2>{project.title}</h2><span>{project.status} ↗</span></Link>)}</div></section>
    <section className="home-note"><div><p className="eyebrow">MOMENTS</p><h2>不是所有内容都需要成为文章。</h2></div><p>说说记录正在形成的想法、值得再次查看的素材，以及尚未适合被归类的问题。</p><Link className="line-link" href="/notes">查看全部说说 <span>→</span></Link></section>
    <SiteFooter />
  </main>;
}
