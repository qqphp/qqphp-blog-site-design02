'use client';

import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, ListMusic, Music2, Pause, Play, SkipBack, SkipForward, Volume2, X } from 'lucide-react';
import { formatTime, tracks } from '@/lib/music';

const MusicContext = createContext<{ index: number; playing: boolean; playTrack: (index: number) => void; toggle: () => void } | null>(null);

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) throw new Error('MusicProvider is required');
  return context;
}

export function MusicProvider({ children }: { children: ReactNode }) {
  const audio = useRef<HTMLAudioElement>(null);
  const request = useRef(0);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(tracks[0].duration);
  const [volume, setVolume] = useState(0.5);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [playlist, setPlaylist] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  async function start() {
    const element = audio.current;
    if (!element) return;
    const attempt = ++request.current;
    element.volume = volume;
    setError('');
    setLoading(true);
    try { await element.play(); }
    catch { if (attempt === request.current) { setError('暂时无法播放，请点击播放重试。'); setPlaying(false); } }
    finally { if (attempt === request.current) setLoading(false); }
  }

  function playTrack(nextIndex: number) {
    const next = (nextIndex + tracks.length) % tracks.length;
    const element = audio.current;
    if (!element) return;
    ++request.current;
    element.pause();
    element.src = tracks[next].src;
    element.load();
    setIndex(next);
    setTime(0);
    setDuration(tracks[next].duration);
    void start();
  }

  function toggle() {
    const element = audio.current;
    if (!element) return;
    if (!element.paused) { ++request.current; element.pause(); setLoading(false); }
    else { void start(); }
  }

  return <MusicContext.Provider value={{ index, playing, playTrack, toggle }}>
    {children}
    <audio ref={audio} src={tracks[0].src} preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onTimeUpdate={() => setTime(audio.current?.currentTime ?? 0)} onLoadedMetadata={() => { const length = audio.current?.duration; if (length && Number.isFinite(length)) setDuration(length); }} onEnded={() => playTrack(index + 1)} onWaiting={() => setLoading(true)} onPlaying={() => setLoading(false)} onError={() => { ++request.current; setError('音频加载失败，请重试或切换下一首。'); setLoading(false); setPlaying(false); }}><track kind="captions" src="/audio/instrumental.vtt" srcLang="zh" label="纯音乐说明" default /></audio>
    <aside className={`music-dock${collapsed ? ' is-collapsed' : ''}`} aria-label="全局音乐播放器">
      {playlist && !collapsed && <section className="music-queue" id="music-queue" aria-label="当前歌单"><div className="music-queue-heading"><h2>日常的背景音 <small>{tracks.length} 首</small></h2><button type="button" aria-label="关闭歌单" onClick={() => setPlaylist(false)}><X size={16} /></button></div><ol>{tracks.map((track, i) => <li key={track.id}><button type="button" aria-current={i === index ? 'true' : undefined} onClick={() => playTrack(i)}><span>{String(i + 1).padStart(2, '0')}</span><span>{track.title}<small>{track.mood}</small></span><span>{i === index && playing ? '播放中' : formatTime(track.duration)}</span></button></li>)}</ol><p>原创合成示例 · 无第三方录音采样</p></section>}
      <div className="music-dock-main"><button className="music-disc" type="button" aria-label={collapsed ? '展开播放器' : '收起播放器'} onClick={() => { setCollapsed(!collapsed); setPlaylist(false); }}><Music2 size={20} /></button><div className="music-now"><strong>{tracks[index].title}</strong><small>{loading ? '正在加载…' : playing ? '正在播放 · ' + tracks[index].mood : '轻触播放 · 合成示例'}</small></div><div className="music-transport">{!collapsed && <button type="button" aria-label="上一首" onClick={() => playTrack(index - 1)}><SkipBack size={17} /></button>}<button className="music-play" type="button" aria-label={playing ? '暂停' : '播放'} onClick={toggle}>{playing ? <Pause size={17} /> : <Play size={17} />}</button>{!collapsed && <button type="button" aria-label="下一首" onClick={() => playTrack(index + 1)}><SkipForward size={17} /></button>}</div>{!collapsed && <button type="button" aria-label="查看歌单" aria-expanded={playlist} aria-controls={playlist ? 'music-queue' : undefined} onClick={() => setPlaylist(!playlist)}><ListMusic size={18} /></button>}</div>
      {!collapsed && <><div className="music-seek"><span>{formatTime(time)}</span><input type="range" aria-label="播放进度" min={0} max={duration} step={0.1} value={Math.min(time, duration)} onChange={(event) => { const next = Number(event.target.value); if (audio.current && audio.current.readyState > 0) { audio.current.currentTime = next; setTime(next); } }} /><span>{formatTime(duration)}</span></div><div className="music-dock-bottom"><label><Volume2 size={13} /><span className="sr-only">音量</span><input type="range" aria-label="音量" min={0} max={1} step={0.05} value={volume} onChange={(event) => { const value = Number(event.target.value); setVolume(value); if (audio.current) audio.current.volume = value; }} /></label><span>顺序循环</span><button type="button" aria-label="收起播放器" onClick={() => { setCollapsed(true); setPlaylist(false); }}><ChevronDown size={15} /></button></div></>}
      {error && <p className="music-error" role="alert">{error}</p>}
    </aside>
  </MusicContext.Provider>;
}
