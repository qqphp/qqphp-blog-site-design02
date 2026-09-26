import { CmsText } from '@/components/cms-text';
import Image from 'next/image';
import Link from 'next/link';
import { HeroGarden } from '@/components/hero-garden';
import { getPublicContent, getRecentArticles, getRecentProjects } from '@/lib/cms-server';

import { SiteFooter, SiteHeader } from '@/components/site-chrome';

export default async function Home() {
  const [{ home }, latestWriting, latestProjects] = await Promise.all([
    getPublicContent(['home']), getRecentArticles(3), getRecentProjects(2),
  ]);
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
          {latestWriting.map((entry) => (
            <Link
              className="entry"
              href={`/writing/${entry.slug}`}
              key={entry.slug}
            >
              <div className="entry-cover">
                {entry.cover ? (
                  <Image
                    src={entry.cover}
                    width={600}
                    height={400}
                    sizes="(max-width: 700px) calc(100vw - 50px), 210px"
                    alt=""
                  />
                ) : (
                  <span>{entry.category}</span>
                )}
              </div>
              <div className="entry-content">
                <div className="entry-meta">
                  <time dateTime={entry.date.replaceAll('.', '-')}>
                    {entry.date.slice(5)}
                  </time>
                  <span>{entry.category}</span>
                </div>
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
          {latestProjects.map((project, index) => {
            const cover = project.images.find((image) => image.src);
            return (
              <Link
                className={`shelf-card ${['a', 'b'][index]}`}
                href={`/projects?project=${project.id}`}
                key={project.id}
              >
                <div className="shelf-art">
                  {cover ? (
                    <Image
                      src={cover.src}
                      width={1200}
                      height={750}
                      sizes="(max-width: 700px) calc(100vw - 102px), (max-width: 1420px) 38vw, 500px"
                      alt={cover.alt || `${project.title}项目封面`}
                    />
                  ) : (
                    <span>{project.category}</span>
                  )}
                </div>
                <p>{project.category}</p>
                <h2>{project.title}</h2>
                <span>{project.status} ↗</span>
              </Link>
            );
          })}
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
