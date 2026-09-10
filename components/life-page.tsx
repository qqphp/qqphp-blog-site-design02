'use client';
import { CmsText } from '@/components/cms-text';

import { useContent } from '@/components/content-provider';


import Image from 'next/image';
import { useState } from 'react';
import { LifeNavigation, SiteFooter, SiteHeader } from '@/components/site-chrome';
import { PodcastLibrary } from '@/components/podcast-library';
import { FilmLibrary } from '@/components/film-library';
import { MusicLibrary } from '@/components/music-library';
import { LifePageHeader } from '@/components/life-page-header';
import { type LifeKind } from '@/lib/life-content';



function LifeCollection({ type }: { type: Exclude<LifeKind, 'films' | 'podcasts'> }) {
  const lifeContent = useContent();
  const page = lifeContent[type];
  const [category, setCategory] = useState('全部');
  const categories = ['全部', ...new Set(page.entries.map((entry) => entry.category))];
  const entries = page.entries.filter((entry) => category === '全部' || entry.category === category);
  return <>
    <section className={`life-feature life-feature-${type}`}><div><p className="life-overline">{page.english}<CmsText page="生活栏目" name="16 / NOTES & STORIES" /></p><h2>{page.feature}</h2><p>{lifeContent.pageSettings[type].description}</p></div>{type === 'travel' ? <Image width={800} height={500} src={lifeContent.pageSettings.travelCover.src} alt={lifeContent.pageSettings.travelCover.alt} /> : <div className="life-feature-art" aria-hidden="true"><span>{'MAKE'}</span><i /><b>{'TIME / FOR YOURSELF'}</b></div>}</section>
    <div className="life-collection-bar"><div className="life-filters" aria-label={`${page.title}分类`}>{categories.map((name) => <button type="button" aria-pressed={category === name} key={name} onClick={() => setCategory(name)}>{name}</button>)}</div><output aria-live="polite">{entries.length} {type === 'travel' ? '条路线' : '项练习'}</output></div>
    <section className={`life-collection life-collection-${type}`} aria-label={`${page.title}内容`}>{entries.map((entry) => <article className="life-entry" key={entry.id}>
      {type === 'travel' && <div className="travel-entry-image"><Image width={800} height={500} src={entry.image!} alt={`${entry.title}的示例景观`} loading="lazy" /><span><CmsText page="生活栏目" name="17 IMAGINED JOURNEY" /></span></div>}

      <div className="life-entry-body"><p className="life-entry-meta">{entry.subtitle}</p><h3>{entry.title}</h3><p className="life-entry-description">{entry.description}</p><details><summary>{page.action}<span aria-hidden="true">+</span></summary><div className="life-entry-text">{entry.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></details></div>
    </article>)}</section>
    <p className="life-source-note">{type === 'hobbies' ? 'AI 创作的练习示例，不代表个人实践记录。' : 'AI 创作的虚构示例，不代表真实作品、人物对话或旅行经历。'}{type === 'travel' && ' 配图为项目现有示例图片。'}<CmsText page="生活栏目" name="19 后续可替换为真实内容。" /></p>
  </>;
}

export function LifePage({ type }: { type: LifeKind | 'music' }) {
  const lifeContent = useContent();
  const title = type === 'music' ? '音乐' : lifeContent[type].title;
  const intro = type === 'music' ? '声音是日常的另一种时间线。' : lifeContent[type].intro;
  return <main className="site-shell"><SiteHeader /><div className="life-page"><LifePageHeader kind={type} title={title} intro={intro} /><LifeNavigation />{type === 'music' ? <MusicLibrary /> : type === 'films' ? <FilmLibrary /> : type === 'podcasts' ? <PodcastLibrary /> : <LifeCollection key={type} type={type} />}</div><SiteFooter /></main>;
}
