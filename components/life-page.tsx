'use client';
import { CmsText } from '@/components/cms-text';

import { useContent } from '@/components/content-provider';


import Image from 'next/image';
import { useState } from 'react';
import { Headphones, Pause, Play } from 'lucide-react';
import { LifeNavigation, SiteFooter, SiteHeader } from '@/components/site-chrome';
import { useMusic } from '@/components/music-player';
import { LifePageHeader } from '@/components/life-page-header';
import { formatTime } from '@/lib/music';
import { type LifeKind } from '@/lib/life-content';



function MusicShelf() {
  const { tracks } = useContent();
  const { index, playing, playTrack, toggle } = useMusic();
  if (!tracks.length) return <p><CmsText page="生活栏目" name="01 暂无已发布音乐。" /></p>;
  return <>
    <section className="listening-room"><div className={`listening-record${playing ? ' is-playing' : ''}`} aria-hidden="true"><div><span><CmsText page="生活栏目" name="02 ALEI" /></span><b>日常<br /><CmsText page="生活栏目" name="03 背景音" /></b><small><CmsText page="生活栏目" name="04 SIDE A / 001" /></small></div></div><div className="listening-feature"><p className="life-overline"><CmsText page="生活栏目" name="05 THE LISTENING ROOM" /></p><h2><CmsText page="生活栏目" name="06 让声音，" /><br /><CmsText page="生活栏目" name="07 留在生活的间隙。" /></h2><p><CmsText page="生活栏目" name="08 三段轻盈的合成音乐。工作时、读书时，" /></p><button type="button" className="life-action" onClick={toggle}>{playing ? <Pause size={17} /> : <Play size={17} />}{playing ? '暂停播放' : `播放 · ${tracks[index].title}`}</button><small><CmsText page="生活栏目" name="09 原创合成示例 · 每首 48 秒 ·" /></small></div></section>
    <div className="life-section-heading"><h2><CmsText page="生活栏目" name="10 日常的背景音" /></h2><span>{tracks.length}<CmsText page="生活栏目" name="11 TRACKS / 顺序循环" /></span></div>
    <section className="music-shelf" aria-label="音乐歌单">{tracks.map((track, i) => <article className={`music-shelf-card${index === i ? ' is-current' : ''}`} key={track.id}><div className={`music-cover music-cover-${i}`} aria-hidden="true"><span>{String(i + 1).padStart(2, '0')}</span><i /><b>{track.title}</b><small><CmsText page="生活栏目" name="12 ORIGINAL SYNTHESIS" /></small></div><div className="music-shelf-info"><span>{track.mood} / {formatTime(track.duration)}</span><h3>{track.title}</h3><p>{track.note}</p><button type="button" onClick={() => index === i && playing ? toggle() : playTrack(i)}>{index === i && playing ? <Pause size={16} /> : <Play size={16} />}{index === i && playing ? '暂停这首' : '播放这首'}</button></div></article>)}</section>
    <aside className="life-editor-note"><Headphones size={22} /><div><h3><CmsText page="生活栏目" name="13 从这里播放，带到下一页。" /></h3><p><CmsText page="生活栏目" name="14 歌单与右下角播放器同步。在站内切换页" /></p><p><CmsText page="生活栏目" name="15 这些声音由程序合成，未使用第三方曲目" /></p></div></aside>
  </>;
}

function LifeCollection({ type }: { type: LifeKind }) {
  const lifeContent = useContent();
  const page = lifeContent[type];
  const [category, setCategory] = useState('全部');
  const categories = ['全部', ...new Set(page.entries.map((entry) => entry.category))];
  const entries = page.entries.filter((entry) => category === '全部' || entry.category === category);
  return <>
    <section className={`life-feature life-feature-${type}`}><div><p className="life-overline">{page.english}<CmsText page="生活栏目" name="16 / NOTES & STORIES" /></p><h2>{page.feature}</h2><p>{lifeContent.pageSettings[type].description}</p></div>{type === 'travel' ? <Image width={800} height={500} src={lifeContent.pageSettings.travelCover.src} alt={lifeContent.pageSettings.travelCover.alt} /> : <div className="life-feature-art" aria-hidden="true"><span>{type === 'films' ? '24' : type === 'podcasts' ? 'ON AIR' : 'MAKE'}</span><i /><b>{type === 'films' ? 'FRAMES / SECOND' : type === 'podcasts' ? 'WORDS / IDEAS' : 'TIME / FOR YOURSELF'}</b></div>}</section>
    <div className="life-collection-bar"><div className="life-filters" aria-label={`${page.title}分类`}>{categories.map((name) => <button type="button" aria-pressed={category === name} key={name} onClick={() => setCategory(name)}>{name}</button>)}</div><output aria-live="polite">{entries.length} {type === 'films' ? '个故事' : type === 'podcasts' ? '篇文字稿' : type === 'travel' ? '条路线' : '项练习'}</output></div>
    <section className={`life-collection life-collection-${type}`} aria-label={`${page.title}内容`}>{entries.map((entry) => <article className="life-entry" key={entry.id}>
      {type === 'travel' && <div className="travel-entry-image"><Image width={800} height={500} src={entry.image!} alt={`${entry.title}的示例景观`} loading="lazy" /><span><CmsText page="生活栏目" name="17 IMAGINED JOURNEY" /></span></div>}
      {type === 'films' && <div className={`film-poster film-poster-${page.entries.findIndex(item => item.id === entry.id)}`} aria-hidden="true"><span><CmsText page="生活栏目" name="18 FICTIONAL SHORT FI" /></span><i /><b>{entry.title}</b><small>{entry.subtitle.split(' / ')[0]}</small></div>}
      <div className="life-entry-body"><p className="life-entry-meta">{entry.subtitle}</p><h3>{entry.title}</h3><p className="life-entry-description">{entry.description}</p><details><summary>{page.action}<span aria-hidden="true">+</span></summary><div className="life-entry-text">{entry.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></details></div>
    </article>)}</section>
    <p className="life-source-note">{type === 'hobbies' ? 'AI 创作的练习示例，不代表个人实践记录。' : 'AI 创作的虚构示例，不代表真实作品、人物对话或旅行经历。'}{type === 'travel' && ' 配图为项目现有示例图片。'}<CmsText page="生活栏目" name="19 后续可替换为真实内容。" /></p>
  </>;
}

export function LifePage({ type }: { type: LifeKind | 'music' }) {
  const lifeContent = useContent();
  const title = type === 'music' ? '音乐' : lifeContent[type].title;
  const intro = type === 'music' ? '声音是日常的另一种时间线。' : lifeContent[type].intro;
  return <main className="site-shell"><SiteHeader /><div className="life-page"><LifePageHeader kind={type} title={title} intro={intro} /><LifeNavigation />{type === 'music' ? <MusicShelf /> : <LifeCollection key={type} type={type} />}</div><SiteFooter /></main>;
}
