'use client';


import Image from 'next/image';
import { useState } from 'react';
import { Headphones, Pause, Play } from 'lucide-react';
import { LifeNavigation, SiteFooter, SiteHeader } from '@/components/site-chrome';
import { useMusic } from '@/components/music-player';
import { formatTime, tracks } from '@/lib/music';
import { lifeContent, type LifeKind } from '@/lib/life-content';



function MusicShelf() {
  const { index, playing, playTrack, toggle } = useMusic();
  return <>
    <section className="listening-room"><div className={`listening-record${playing ? ' is-playing' : ''}`} aria-hidden="true"><div><span>ALEI</span><b>日常<br />背景音</b><small>SIDE A / 001</small></div></div><div className="listening-feature"><p className="life-overline">THE LISTENING ROOM</p><h2>让声音，<br />留在生活的间隙。</h2><p>三段轻盈的合成音乐。工作时、读书时，或只是放空一会儿。</p><button type="button" className="life-action" onClick={toggle}>{playing ? <Pause size={17} /> : <Play size={17} />}{playing ? '暂停播放' : `播放 · ${tracks[index].title}`}</button><small>原创合成示例 · 每首 48 秒 · 无第三方录音采样</small></div></section>
    <div className="life-section-heading"><h2>日常的背景音</h2><span>03 TRACKS / 顺序循环</span></div>
    <section className="music-shelf" aria-label="音乐歌单">{tracks.map((track, i) => <article className={`music-shelf-card${index === i ? ' is-current' : ''}`} key={track.id}><div className={`music-cover music-cover-${i}`} aria-hidden="true"><span>{String(i + 1).padStart(2, '0')}</span><i /><b>{track.title}</b><small>ORIGINAL SYNTHESIS</small></div><div className="music-shelf-info"><span>{track.mood} / {formatTime(track.duration)}</span><h3>{track.title}</h3><p>{track.note}</p><button type="button" onClick={() => index === i && playing ? toggle() : playTrack(i)}>{index === i && playing ? <Pause size={16} /> : <Play size={16} />}{index === i && playing ? '暂停这首' : '播放这首'}</button></div></article>)}</section>
    <aside className="life-editor-note"><Headphones size={22} /><div><h3>从这里播放，带到下一页。</h3><p>歌单与右下角播放器同步。在站内切换页面时，音乐会继续；刷新页面后，由你重新开始播放。</p><p>这些声音由程序合成，未使用第三方曲目或录音采样。后续可替换为真实音乐与对应授权信息。</p></div></aside>
  </>;
}

function LifeCollection({ type }: { type: LifeKind }) {
  const page = lifeContent[type];
  const [category, setCategory] = useState('全部');
  const categories = ['全部', ...new Set(page.entries.map((entry) => entry.category))];
  const entries = page.entries.filter((entry) => category === '全部' || entry.category === category);
  return <>
    <section className={`life-feature life-feature-${type}`}><div><p className="life-overline">{page.english} / NOTES & STORIES</p><h2>{page.feature}</h2><p>{type === 'films' ? '四个虚构短片的故事提案，从城市、生活、声音到实验影像。' : type === 'podcasts' ? '四篇虚构对话文字稿，从创作、技术聊到阅读与日常。暂未提供节目音频。' : type === 'travel' ? '三条想象中的路线，收集海风、水面与树影。' : '从五分钟开始，在写字、摄影和聆听里找回手感。'}</p></div>{type === 'travel' ? <Image width={800} height={500} src="/stories-coast.png" alt="旅行栏目示例海岸景观" /> : <div className="life-feature-art" aria-hidden="true"><span>{type === 'films' ? '24' : type === 'podcasts' ? 'ON AIR' : 'MAKE'}</span><i /><b>{type === 'films' ? 'FRAMES / SECOND' : type === 'podcasts' ? 'WORDS / IDEAS' : 'TIME / FOR YOURSELF'}</b></div>}</section>
    <div className="life-collection-bar"><div className="life-filters" aria-label={`${page.title}分类`}>{categories.map((name) => <button type="button" aria-pressed={category === name} key={name} onClick={() => setCategory(name)}>{name}</button>)}</div><output aria-live="polite">{entries.length} {type === 'films' ? '个故事' : type === 'podcasts' ? '篇文字稿' : type === 'travel' ? '条路线' : '项练习'}</output></div>
    <section className={`life-collection life-collection-${type}`} aria-label={`${page.title}内容`}>{entries.map((entry) => <article className="life-entry" key={entry.id}>
      {type === 'travel' && <div className="travel-entry-image"><Image width={800} height={500} src={entry.image!} alt={`${entry.title}的示例景观`} loading="lazy" /><span>IMAGINED JOURNEY</span></div>}
      {type === 'films' && <div className={`film-poster film-poster-${page.entries.indexOf(entry)}`} aria-hidden="true"><span>FICTIONAL SHORT FILM</span><i /><b>{entry.title}</b><small>{entry.subtitle.split(' / ')[0]}</small></div>}
      <div className="life-entry-body"><p className="life-entry-meta">{entry.subtitle}</p><h3>{entry.title}</h3><p className="life-entry-description">{entry.description}</p><details><summary>{page.action}<span aria-hidden="true">+</span></summary><div className="life-entry-text">{entry.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></details></div>
    </article>)}</section>
    <p className="life-source-note">{type === 'hobbies' ? 'AI 创作的练习示例，不代表个人实践记录。' : 'AI 创作的虚构示例，不代表真实作品、人物对话或旅行经历。'}{type === 'travel' && ' 配图为项目现有示例图片。'}后续可替换为真实内容。</p>
  </>;
}

export function LifePage({ type }: { type: LifeKind | 'music' }) {
  const title = type === 'music' ? '音乐' : lifeContent[type].title;
  const intro = type === 'music' ? '声音是日常的另一种时间线。' : lifeContent[type].intro;
  return <main className="site-shell"><SiteHeader /><div className="life-page"><header className="life-page-heading"><div><p className="life-overline">OFF THE CLOCK / 生活索引</p><h1>{title}</h1><p>{intro}</p></div><span>DEMO / 示例内容</span></header><LifeNavigation />{type === 'music' ? <MusicShelf /> : <LifeCollection key={type} type={type} />}</div><SiteFooter /></main>;
}
