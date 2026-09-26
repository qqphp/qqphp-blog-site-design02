'use client';
import { ActivityLibrary } from '@/components/activity-library';

import { useContent } from '@/components/content-provider';


import { LifeNavigation, SiteFooter, SiteHeader } from '@/components/site-chrome';
import { PodcastLibrary } from '@/components/podcast-library';
import { FilmLibrary } from '@/components/film-library';
import { MusicLibrary } from '@/components/music-library';
import { LifePageHeader } from '@/components/life-page-header';
import { type LifeKind } from '@/lib/life-content';



export function LifePage({ type }: { type: LifeKind | 'music' }) {
  const lifeContent = useContent();
  const title = type === 'music' ? '音乐' : lifeContent[type].title;
  const intro = type === 'music' ? '声音是日常的另一种时间线。' : type === 'travel' ? '三条想象中的路线，收集海风、水面与树影。' : type === 'hobbies' ? '从五分钟开始，在写字、摄影和聆听里找回手感。' : lifeContent[type].intro;
  return <main className="site-shell"><SiteHeader /><div className="life-page"><LifePageHeader kind={type} title={title} intro={intro} /><LifeNavigation />{type === 'music' ? <MusicLibrary /> : type === 'films' ? <FilmLibrary /> : type === 'podcasts' ? <PodcastLibrary /> : <ActivityLibrary key={type} section={type} />}</div><SiteFooter /></main>;
}
