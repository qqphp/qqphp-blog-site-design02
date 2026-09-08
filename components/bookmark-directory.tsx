'use client';
import { CmsText } from '@/components/cms-text';

import { useContent } from '@/components/content-provider';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight, Bookmark, Search, X } from 'lucide-react';


const pageSize = 24;

export function BookmarkDirectory() {
  const { bookmarks } = useContent();
  const categories = [...new Set(bookmarks.map((item) => item.category))];
  const [category, setCategory] = useState('全部');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(pageSize);
  const search = query.trim().toLocaleLowerCase();
  const matches = bookmarks.filter((item) => [item.name, item.url, item.description, item.category, ...item.tags].join(' ').toLocaleLowerCase().includes(search));
  const filtered = matches.filter((item) => category === '全部' || item.category === category);
  const visible = filtered.slice(0, limit);
  function reset() { setQuery(''); setCategory('全部'); setLimit(pageSize); }

  return <div className="directory-page">
    <header className="directory-heading"><div><p className="directory-kicker"><CmsText page="书签页" name="01 THE WEB, COLLECTED" /></p><h1>书签<span><CmsText page="书签页" name="02 值得再次打开。" /></span></h1><p><CmsText page="书签页" name="03 工具、灵感与长篇阅读，给好奇心留一份" /></p></div><Link className="directory-crosslink" href="/friends"><CmsText page="书签页" name="04 去友链串门" /><ArrowUpRight size={16} /></Link></header>
    <div className="directory-layout">
      <aside className="directory-sidebar" aria-label="书签分类"><div className="directory-side-title"><Bookmark size={16} /><span><CmsText page="书签页" name="05 收藏目录" /></span><small>{bookmarks.length}</small></div><div className="directory-categories">{['全部', ...categories].map((name, index) => <button type="button" key={name} aria-pressed={category === name} onClick={() => { setCategory(name); setLimit(pageSize); }}><span><i>{String(index).padStart(2, '0')}</i>{name}</span><small>{name === '全部' ? matches.length : matches.filter((item) => item.category === name).length}</small></button>)}</div><p className="directory-side-note">{categories.length}<CmsText page="书签页" name="06 个主题 · 慢慢积累" /><br /><CmsText page="书签页" name="07 示例收藏，可按需替换。" /></p></aside>
      <section className="directory-results" aria-label="书签目录">
        <div className="directory-search"><Search size={18} aria-hidden="true" /><input type="search" aria-label="搜索书签" placeholder="搜索名称、网址、关键词…" value={query} onChange={(event) => { setQuery(event.target.value); setLimit(pageSize); }} />{query && <button type="button" aria-label="清空搜索" onClick={() => { setQuery(''); setLimit(pageSize); }}><X size={17} /></button>}</div>
        <div className="directory-result-line"><h2>{category === '全部' ? '全部收藏' : category}</h2><output aria-live="polite">{filtered.length}<CmsText page="书签页" name="08 个书签" />{search ? '符合搜索' : ''}</output></div>
        {categories.map((name) => { const items = visible.filter((item) => item.category === name); return items.length > 0 && <section className="bookmark-section" key={name} aria-label={name}><h3><span>{name}</span><small>{filtered.filter((item) => item.category === name).length.toString().padStart(2, '0')}</small><i /></h3><div className="bookmark-cards">{items.map((item) => <a className="bookmark-card" href={item.url} target="_blank" rel="noopener noreferrer" key={item.url} aria-label={`${item.name}（在新标签页打开）`}><div className="bookmark-card-top"><span className="bookmark-monogram" aria-hidden="true">{item.name.slice(0, 2).toUpperCase()}</span><div><h4>{item.name}</h4><small>{new URL(item.url).hostname.replace(/^www\./, '')}</small></div><ArrowUpRight size={17} /></div><p>{item.description}</p><div className="directory-tags">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></a>)}</div></section>; })}
        {filtered.length === 0 && <div className="directory-empty"><Search size={26} /><h3><CmsText page="书签页" name="09 没有找到这枚书签" /></h3><p><CmsText page="书签页" name="10 试试其他关键词，或回到全部收藏。" /></p><button type="button" onClick={reset}><CmsText page="书签页" name="11 重置筛选" /></button></div>}
        {visible.length < filtered.length && <button className="directory-more" type="button" onClick={() => setLimit(limit + pageSize)}><CmsText page="书签页" name="12 再显示" />{Math.min(pageSize, filtered.length - visible.length)}<CmsText page="书签页" name="13 个书签" /><span>↓</span></button>}
        <p className="directory-end"><CmsText page="书签页" name="14 已显示" />{visible.length} / {filtered.length}<CmsText page="书签页" name="15 · 外部网站在新标签页打开" /></p>
      </section>
    </div>
  </div>;
}

