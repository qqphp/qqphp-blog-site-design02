'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { writing } from '../content';
import { PageIntro, SiteFooter, SiteHeader } from '@/components/site-chrome';
import { Input } from '@/components/ui/input';

const groups = [...new Set(writing.map((item) => item.category))];

export default function WritingPage() {
  const [group, setGroup] = useState('全部');
  const [subgroup, setSubgroup] = useState('全部');
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () =>
      writing.filter(
        (item) =>
          (group === '全部' || item.category === group) &&
          (subgroup === '全部' || item.label === subgroup) &&
          `${item.title} ${item.excerpt} ${item.tag} ${item.category} ${item.label}`
            .toLocaleLowerCase()
            .includes(query.trim().toLocaleLowerCase()),
      ),
    [group, subgroup, query],
  );
  return (
    <main className="site-shell">
      <SiteHeader />
      <PageIntro
        title="记录思考，分享实践。"
        text="分享实践中的经验、方法与观察，也记录那些值得继续探讨的问题。"
      />
      <section className="writing-tools">
        <div className="writing-search">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="输入即搜索文章、主题或关键词"
            aria-label="搜索文章"
          />
        </div>
        <span>共 {filtered.length} 篇结果</span>
      </section>
      <section className="archive-layout">
        <aside className="archive-side">
          <p>文章分类</p>
          <button
            className={group === '全部' && subgroup === '全部' ? 'active' : ''}
            type="button"
            onClick={() => {
              setGroup('全部');
              setSubgroup('全部');
            }}
          >
            全部文章<b>{writing.length}</b>
          </button>
          {groups.map((item) => (
            <div className="category-tree" key={item}>
              <button
                className={
                  group === item && subgroup === '全部' ? 'active' : ''
                }
                type="button"
                onClick={() => {
                  setGroup(item);
                  setSubgroup('全部');
                }}
              >
                {item}
                <b>
                  {writing.filter((entry) => entry.category === item).length}
                </b>
              </button>
              <div className="subcategories">
                {[
                  ...new Set(
                    writing
                      .filter((entry) => entry.category === item)
                      .map((entry) => entry.label),
                  ),
                ].map((sub) => (
                  <button
                    className={subgroup === sub ? 'active' : ''}
                    type="button"
                    onClick={() => {
                      setGroup(item);
                      setSubgroup(sub);
                    }}
                    key={sub}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>
        <div className="archive-main" id="all">
          <div className="archive-toolbar">
            <span>
              {subgroup !== '全部'
                ? subgroup
                : group === '全部'
                  ? '全部文章'
                  : group}
            </span>
            <span>按最新发布</span>
          </div>
          {filtered.map((entry) => (
            <article className="archive-item cover-item" key={entry.title}>
              <Image
                src={entry.cover}
                width={320}
                height={320}
                alt=""
                className="article-cover"
              />
              <div>
                <p className="entry-meta">
                  {entry.category} / {entry.label} / {entry.meta}
                </p>
                <h2>
                  <Link href={`/writing/${entry.slug}`}>{entry.title}</Link>
                </h2>
                <p>{entry.excerpt}</p>
                <div className="tag-row">
                  <span>{entry.tag}</span>
                  <time>{entry.date}</time>
                </div>
              </div>
              <Link
                href={`/writing/${entry.slug}`}
                aria-label={`阅读：${entry.title}`}
              >
                ↗
              </Link>
            </article>
          ))}
          {filtered.length === 0 && (
            <div className="archive-end">
              没有找到匹配的文章，换个关键词试试。
            </div>
          )}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
