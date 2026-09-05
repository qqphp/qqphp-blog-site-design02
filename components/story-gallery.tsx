'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import './story-gallery.css';

const images = [
  { src: '/stories-lake.png', alt: '晨雾中的山湖' },
  { src: '/stories-coast.png', alt: '海岸悬崖步道' },
  { src: '/stories-stream.png', alt: '秋叶与溪流' },
];

export function StoryGallery() {
  const [index, setIndex] = useState(0);
  const touch = useRef<number | null>(null);
  const move = (offset: number) => setIndex((current) => (current + offset + images.length) % images.length);
  return <Dialog><div className="story-gallery-grid">{images.map((image, i) => <DialogTrigger key={image.src} className="story-gallery-thumb" aria-label={`放大查看：${image.alt}`} onClick={() => setIndex(i)}><Image src={image.src} alt={image.alt} width={1200} height={900} /><span>{String(i + 1).padStart(2, '0')} / 放大 ↗</span></DialogTrigger>)}</div><DialogContent className="story-lightbox" onKeyDown={(event) => { if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); } if (event.key === 'ArrowRight') { event.preventDefault(); move(1); } }}><DialogTitle>说说影像</DialogTitle><DialogDescription>使用左右按钮、键盘方向键或滑动切换，按 Esc 关闭。</DialogDescription><div className="story-lightbox-stage" onTouchStart={(event) => { touch.current = event.touches[0].clientX; }} onTouchEnd={(event) => { if (touch.current !== null) { const distance = event.changedTouches[0].clientX - touch.current; if (Math.abs(distance) > 50) move(distance < 0 ? 1 : -1); } touch.current = null; }}><Image src={images[index].src} alt={images[index].alt} width={1600} height={1200} /><button type="button" className="previous" aria-label="上一张图片" onClick={() => move(-1)}><ChevronLeft /></button><button type="button" className="next" aria-label="下一张图片" onClick={() => move(1)}><ChevronRight /></button></div><output aria-live="polite">{images[index].alt} · {index + 1} / {images.length}</output></DialogContent></Dialog>;
}
