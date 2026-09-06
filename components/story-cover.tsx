'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import './story-cover.css';

const slides = [
  { src: '/notes/paper-v2.png', title: '纸上远山', alt: 'AI 生成的纸艺山水与松林', width: 1881, height: 836, position: 'center 55%' },
  { src: '/notes/rain-v2.png', title: '雨夜河畔', alt: 'AI 生成的胶片风格雨夜河畔', width: 1935, height: 813, position: 'center 60%' },
  { src: '/notes/clay-v2.png', title: '柔软小世界', alt: 'AI 生成的黏土小屋与彩色树林', width: 1942, height: 809, position: 'center 60%' },
];

export function StoryCover() {
  const [index, setIndex] = useState(0);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setReduced(media.matches);
    const syncVisibility = () => setHidden(document.hidden);
    syncMotion(); syncVisibility();
    media.addEventListener('change', syncMotion);
    document.addEventListener('visibilitychange', syncVisibility);
    return () => { media.removeEventListener('change', syncMotion); document.removeEventListener('visibilitychange', syncVisibility); };
  }, []);
  useEffect(() => {
    if (focused || hovered || reduced || hidden) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % slides.length), 6000);
    return () => window.clearInterval(timer);
  }, [focused, hovered, reduced, hidden, index]);
  const select = (next: number) => setIndex((next + slides.length) % slides.length);

  // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Pause the carousel region on hover or keyboard focus; navigation uses native buttons.
  return <section className="story-cover story-cover-carousel" aria-label="说说封面轮播" aria-roledescription="轮播" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    {slides.map((slide, i) => <div key={slide.src} className={`story-cover-slide${i === index ? ' is-active' : ''}`} aria-hidden={i !== index}><Image src={slide.src} alt={slide.alt} width={slide.width} height={slide.height} style={{ objectPosition: slide.position }} sizes="(max-width: 1420px) 100vw, 1420px" priority={i === 0} /></div>)}
    <div className="story-cover-controls">{slides.map((slide, i) => <button type="button" key={slide.src} aria-label={`切换到${slide.title}`} aria-pressed={i === index} onClick={() => select(i)}><i /></button>)}</div>
    <p className="story-cover-caption" aria-live={focused ? 'polite' : 'off'}>{slides[index].title} / AI 生成</p>
  </section>;
}
