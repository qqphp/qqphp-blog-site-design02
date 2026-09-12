'use client';
import { CmsText } from '@/components/cms-text';

import { useContent } from '@/components/content-provider';

import { StoryGallery } from '@/components/story-gallery';
import { StoryCover } from '@/components/story-cover';
import { useState } from 'react';

import { monthSummary } from '@/lib/story-calendar';
import { newestStoriesFirst, normalizeStoryTopics } from '@/lib/story-content';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';

const weekdays = ['一', '二', '三', '四', '五', '六', '日'];

export default function StoriesPage() {
  const { stories, site } = useContent();
  const latestDate =
    stories
      .map((story) => story.date)
      .sort()
      .at(-1) ?? '2026-09-01';
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
            <h1>{site.name}</h1>
            <p>
              <CmsText
                page="说说页"
                name="01 记录正在发生的事，也保留还没有答案的"
              />
            </p>
          </div>
        </div>
      </section>
      <section className="story-layout">
        <aside className="story-sidebar calendar-side">
          <p>
            {year}
            <CmsText page="说说页" name="02 年发布汇总 · 示例" />
          </p>
          <strong>{yearlyStories.length}</strong>
          <span>
            <CmsText page="说说页" name="03 条说说 ·" />
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
            <b>
              <CmsText page="说说页" name="05 阅读间隙" />
            </b>
            <p>
              <CmsText
                page="说说页"
                name="06 “每一个当下，都是通向未来的入口。”"
              />
            </p>
          </div>
        </aside>
        <div className="story-feed">
          {newestStoriesFirst(stories).map((story) => (
            <article className="story-post" key={story.id}>
              <div className="post-avatar">A</div>
              <div className="post-body">
                <header>
                  <b>
                    <CmsText page="说说页" name="08 发布名称" />
                  </b>
                  <time dateTime={story.date}>
                    {story.date.slice(0, 10).replaceAll('-', '.')}{' '}
                    {story.date.slice(11, 19)}
                  </time>
                </header>
                <p>{story.text}</p>
                <StoryGallery images={story.images} />
                <div className="story-post-topics">
                  {normalizeStoryTopics(story.topics).map((topic) => (
                    <span className="story-topic" key={topic}>
                      #{topic}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
