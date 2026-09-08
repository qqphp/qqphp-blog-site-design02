import { CmsText } from '@/components/cms-text';
import Link from 'next/link';
import { HeroGarden } from '@/components/hero-garden';
import { getPublicContent } from '@/lib/cms-server';

import { SiteFooter, SiteHeader } from '@/components/site-chrome';

export default async function Home() {
  const { writing, projects, home } = await getPublicContent();
  return (
    <main className="site-shell">
      <SiteHeader />
      <section className="hero hero-live" id="top">
        <div className="hero-copy">
          <p className="eyebrow">{home.eyebrow}</p>
          <h1 style={{ whiteSpace: 'pre-line' }}>{home.title}</h1>
          <div className="hero-bottom">
            <p style={{ whiteSpace: 'pre-line' }}>{home.description}</p>
            <Link
              className="round-link"
              href="/writing"
              aria-label="查看最近更新"
            >
              ↓
            </Link>
          </div>
        </div>
        <HeroGarden />
      </section>
      <section className="latest">
        <div className="section-label">
          <span>01</span><CmsText page="首页栏目" name="01 最近更新" /></div>
        <div className="entry-list">
          {writing.slice(0, 3).map((entry) => (
            <Link
              className="entry"
              href={`/writing/${entry.slug}`}
              key={entry.title}
            >
              <span className="entry-meta">
                {entry.label} · {entry.date.slice(5)}
              </span>
              <div>
                <h2>{entry.title}</h2>
                <p>{entry.excerpt}</p>
              </div>
              <span className="entry-arrow">↗</span>
            </Link>
          ))}
          <Link className="more-row" href="/writing"><CmsText page="首页栏目" name="02 查看全部写作" /><span>→</span>
          </Link>
        </div>
      </section>
      <section className="home-projects">
        <div className="home-project-head">
          <p className="eyebrow"><CmsText page="首页栏目" name="03 SELECTED WORK" /></p>
          <Link href="/projects"><CmsText page="首页栏目" name="04 全部项目 →" /></Link>
        </div>
        <div className="project-shelf">
          {projects.items.slice(0, 2).map((project, index) => (
            <Link
              className={`shelf-card ${['a', 'b'][index]}`}
              href={`/projects?project=${project.id}`}
              key={project.id}
            >
              <div className="shelf-art">

                <em />
              </div>
              <p>{project.category}</p>
              <h2>{project.title}</h2>
              <span>{project.status} ↗</span>
            </Link>
          ))}
        </div>
      </section>
      <section className="home-note">
        <div>
          <p className="eyebrow"><CmsText page="首页栏目" name="05 MOMENTS" /></p>
          <h2>{home.noteTitle}</h2>
        </div>
        <p>
          {home.noteText}
        </p>
        <Link className="line-link" href="/notes"><CmsText page="首页栏目" name="06 查看全部说说" /><span>→</span>
        </Link>
      </section>
      <SiteFooter />
    </main>
  );
}
