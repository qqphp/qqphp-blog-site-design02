'use client';

import Image from 'next/image';
import { useState } from 'react';
import { stories } from '../content';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';

const weekdays = ['一', '二', '三', '四', '五', '六', '日'];
const storyImages = [
  { src: '/stories-lake.png', alt: '晨雾中的山湖', className: 'story-photo-wide' },
  { src: '/stories-coast.png', alt: '海岸悬崖步道', className: 'story-photo-tall' },
  { src: '/stories-stream.png', alt: '秋叶与溪流', className: 'story-photo-square' },
];

export default function StoriesPage() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(9);
  const [commentFor, setCommentFor] = useState<string | null>(null);
  const days = Array.from({ length: new Date(year, month, 0).getDate() }, (_, index) => index + 1);
  const changeMonth = (offset: number) => setMonth((current) => {
    const next = current + offset;
    if (next < 1) { setYear((value) => value - 1); return 12; }
    if (next > 12) { setYear((value) => value + 1); return 1; }
    return next;
  });

  return <main className="site-shell"><SiteHeader />
    <section className="story-top"><div className="story-cover"><span>☼</span></div><div className="story-profile"><div className="story-avatar">A</div><div><h1>开发阿雷</h1><p>记录正在发生的事，也保留还没有答案的问题。</p></div></div></section>
    <section className="story-layout"><aside className="story-sidebar calendar-side"><p>{year} 年发布汇总</p><strong>38</strong><span>条说说 · 12 个话题</span><div className="calendar-head"><button type="button" onClick={() => changeMonth(-1)} aria-label="上一个月">←</button><b>{year} 年 {month} 月</b><button type="button" onClick={() => changeMonth(1)} aria-label="下一个月">→</button></div><div className="calendar-grid">{weekdays.map((day) => <i key={day}>{day}</i>)}{days.map((day) => <span className={day === 3 || day === 12 || day === 21 ? 'has-post' : ''} key={day}>{day}</span>)}</div><div className="today-card"><b>今日 · 09.03</b><p>“每一个当下，都是通向未来的入口。”</p></div></aside>
      <div className="story-feed">{stories.map((story, index) => <article className="story-post" key={story.date}><div className="post-avatar">A</div><div className="post-body"><header><b>开发阿雷</b><time>{story.date}</time></header><p>{story.text}</p><a className="story-topic" href="#topics">#{story.topic}</a>{index === 0 && <div className="story-photo-grid">{storyImages.map((image) => <div className={image.className} key={image.src}><Image src={image.src} alt={image.alt} width={1200} height={900} /></div>)}</div>}<div className="post-actions"><button type="button">♡ {story.reactions}</button><button type="button" onClick={() => setCommentFor(commentFor === story.date ? null : story.date)} aria-expanded={commentFor === story.date}>◌ 评论</button></div>{story.replies.length > 0 && <div className="replies">{story.replies.map((reply) => <p key={reply}><b>朋友：</b>{reply}</p>)}</div>}{commentFor === story.date && <form className="comment-form"><div className="comment-verify"><input type="email" required placeholder="邮箱" aria-label="邮箱" /><input required placeholder="验证码" aria-label="验证码" /><button type="button">发送验证码</button></div><input required placeholder="评论显示名" aria-label="评论显示名" /><textarea required placeholder="写下你的留言…" aria-label="留言内容" /><button type="submit">发布评论</button></form>}</div></article>)}</div>
    </section><SiteFooter /></main>;
}
