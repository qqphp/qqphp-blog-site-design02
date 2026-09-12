'use client';
import { WritingCategoryTree } from '@/components/writing-category-tree';
import { CmsText } from '@/components/cms-text';

import { useContent } from '@/components/content-provider';

import Image from 'next/image';
import Link from 'next/link';
import { categoryRows, categoryBranch } from '@/lib/article-categories';
import { useState } from 'react';

import { PageIntro, SiteFooter, SiteHeader } from '@/components/site-chrome';
import { Input } from '@/components/ui/input';

export default function WritingPage() {
  const { writing, categories } = useContent();
  const rows = categoryRows(categories);
  const [group, setGroup] = useState('');
  const [query, setQuery] = useState('');
  const branch = categoryBranch(categories, group);
  const filtered = writing.filter(
    (item) =>
      (!group || branch.has(item.categoryId)) &&
      `${item.title} ${item.excerpt} ${item.category}`
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
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
        <span>
          共 {filtered.length}
          <CmsText page="写作页" name="01 篇结果" />
        </span>
      </section>
      <section className="archive-layout writing-archive">
        <aside className="archive-side">
          <p>
            <CmsText page="写作页" name="02 文章分类" />
          </p>
          <button
            className={group === '' ? 'active' : ''}
            type="button"
            onClick={() => {
              setGroup('');
            }}
          >
            <CmsText page="写作页" name="03 全部文章" />
            <b>{writing.length}</b>
          </button>
          <WritingCategoryTree
            categories={categories}
            articles={writing}
            selected={group}
            onSelect={setGroup}
          />
        </aside>
        <div className="archive-main" id="all">
          <div className="archive-toolbar">
            <span>
              {rows.find((row) => row.category.id === group)?.path ||
                '全部文章'}
            </span>
            <span>
              <CmsText page="写作页" name="04 按最新发布" />
            </span>
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
                  {entry.category}
                </p>
                <h2>
                  <Link href={`/writing/${entry.slug}`}>{entry.title}</Link>
                </h2>
                <p>{entry.excerpt}</p>
                <div className="tag-row">
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
              <CmsText
                page="写作页"
                name="05 没有找到匹配的文章，换个关键词试试。"
              />
            </div>
          )}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
