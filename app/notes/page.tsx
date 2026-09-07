'use client';

import { StoryGallery } from '@/components/story-gallery';
import { StoryCover } from '@/components/story-cover';
import { useState } from 'react';
import { stories } from '../content';
import { monthSummary } from '@/lib/story-calendar';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';

const weekdays = ['一', '二', '三', '四', '五', '六', '日'];
const latestDate = stories
  .map((story) => story.date)
  .sort()
  .at(-1)!;

export default function StoriesPage() {
  const [period, setPeriod] = useState(
    () =>
      Number(latestDate.slice(0, 4)) * 12 + Number(latestDate.slice(5, 7)) - 1,
  );
  const year = Math.floor(period / 12);
  const month = (period % 12) + 1;
  const calendar = monthSummary(
    stories.map((story) => story.date),
    year,
    month,
  );
  const yearlyStories = stories.filter((story) =>
    story.date.startsWith(`${year}-`),
  );

  return (
    <main className="site-shell">
      <SiteHeader />
      <section className="story-top">
        <StoryCover />
        <div className="story-profile">
          <div className="story-avatar">A</div>
          <div>
            <h1>开发阿雷</h1>
            <p>记录正在发生的事，也保留还没有答案的问题。</p>
          </div>
        </div>
      </section>
      <section className="story-layout">
        <aside className="story-sidebar calendar-side">
          <p>{year} 年发布汇总 · 示例</p>
          <strong>{yearlyStories.length}</strong>
          <span>
            条说说 · {new Set(yearlyStories.map((story) => story.topic)).size}{' '}
            个话题
          </span>
          <div className="calendar-head">
            <button
              type="button"
              onClick={() => setPeriod((value) => value - 1)}
              aria-label="上一个月"
            >
              ←
            </button>
            <b>
              {year} 年 {month} 月
            </b>
            <button
              type="button"
              onClick={() => setPeriod((value) => value + 1)}
              aria-label="下一个月"
            >
              →
            </button>
          </div>
          <div className="calendar-grid">
            {weekdays.map((day) => (
              <i key={day}>{day}</i>
            ))}
            {Array.from({ length: calendar.offset }, (_, index) => (
              <span aria-hidden="true" key={`blank-${index}`} />
            ))}
            {calendar.days.map(({ day, count }) => (
              <span
                className={count ? 'has-post' : ''}
                title={`${year} 年 ${month} 月 ${day} 日：${count} 条说说`}
                key={day}
              >
                {day}
              </span>
            ))}
          </div>
          <div className="today-card">
            <b>阅读间隙</b>
            <p>“每一个当下，都是通向未来的入口。”</p>
          </div>
        </aside>
        <div className="story-feed">
          <p className="story-demo-note">
            以下说说、互动数量与回复均为示例。点赞与评论暂未开放。
          </p>
          {stories.map((story, index) => (
            <article className="story-post" key={story.date}>
              <div className="post-avatar">A</div>
              <div className="post-body">
                <header>
                  <b>开发阿雷</b>
                  <time dateTime={story.date}>
                    {story.date.slice(0, 10).replaceAll('-', '.')}{' '}
                    {story.date.slice(11, 16)}
                  </time>
                </header>
                <p>{story.text}</p>
                <span className="story-topic">#{story.topic}</span>
                {index === 0 && <StoryGallery />}
                <div className="post-actions">
                  <button type="button" disabled title="点赞暂未开放">
                    ♡ {story.reactions}
                  </button>
                  <button type="button" disabled>
                    ◌ 评论暂未开放
                  </button>
                </div>
                {story.replies.length > 0 && (
                  <div className="replies">
                    {story.replies.map((reply) => (
                      <p key={reply}>
                        <b>示例回复：</b>
                        {reply}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
