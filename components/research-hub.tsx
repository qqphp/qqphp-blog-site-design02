'use client';

import { useState } from 'react';
import { ArrowDown, BookOpen, Search, X } from 'lucide-react';
import { researchContent } from '@/lib/research-content';
import './research-hub.css';

export function ResearchHub({ type }: { type: 'ai' | 'investing' }) {
  const page = researchContent[type];
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const search = query.trim().toLowerCase();
  const sections = page.sections.filter((section) => category === 'all' || section.id === category).map((section) => ({ ...section, entries: section.entries.filter((entry) => [section.title, entry.title, entry.tag, entry.description, ...entry.paragraphs].join(' ').toLowerCase().includes(search)) })).filter((section) => section.entries.length > 0);
  const count = sections.reduce((sum, section) => sum + section.entries.length, 0);
  const total = page.sections.reduce((sum, section) => sum + section.entries.length, 0);

  return <div className={`research-hub research-${type}`}><header className="research-heading"><div><p>{page.label}</p><h1>{page.title}</h1></div><span>{page.description}</span></header>
    <div className="research-overview"><section className="research-focus"><p className="research-eyebrow">{type === 'ai' ? '从任务到方法' : '从观察到验证'}</p><h2>{type === 'ai' ? '先让一个小任务，变得更顺手。' : '把判断，写成可以复查的过程。'}</h2><div className="research-steps">{(type === 'ai' ? ['明确问题', '准备输入', '检查输出', '记录边界'] : ['趋势观察', '指标定义', '策略假设', '验证复盘']).map((step, i) => <span key={step}><small>0{i + 1}</small>{step}</span>)}</div><a href="#research-library">浏览研究目录 <ArrowDown size={15} /></a></section><aside className="research-index-card"><BookOpen size={22} /><strong>{String(total).padStart(2, '0')}<small>篇示例笔记</small></strong><p>{type === 'ai' ? '工作流、工具、提示词与学习路线，按主题收纳。' : '趋势、指标、量化与复盘，保留每一步的上下文。'}</p><span>{type === 'ai' ? '编辑示例 · 非实测工具榜单' : '研究示例 · 无实时行情或回测收益'}</span></aside></div>
    <div className="research-topic-grid" aria-label="主题板块">{page.sections.map((section, i) => <button type="button" key={section.id} aria-pressed={category === section.id} onClick={() => { setCategory(section.id); setQuery(''); }}><span>0{i + 1} / {section.entries.length} 篇</span><h2>{section.title}</h2><p>{section.description}</p></button>)}</div>
    <section id="research-library" className="research-library" aria-label="研究目录"><div className="research-toolbar"><div><button type="button" aria-pressed={category === 'all'} onClick={() => setCategory('all')}>全部笔记</button>{category !== 'all' && <span>{page.sections.find((section) => section.id === category)?.title}</span>}<output aria-live="polite">{count} 篇</output></div><div className="research-search"><Search size={16} /><input type="search" aria-label="搜索研究笔记" placeholder="搜索主题、关键词…" value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button type="button" aria-label="清空搜索" onClick={() => setQuery('')}><X size={16} /></button>}</div></div>
      {sections.map((section) => <section className="research-section" key={section.id}><div className="research-section-heading"><h2>{section.title}</h2><p>{section.description}</p></div><div className="research-entries">{section.entries.map((entry) => <article key={entry.title}><span className="research-entry-tag">{entry.tag}</span><h3>{entry.title}</h3><p>{entry.description}</p><details><summary>展开笔记 <span aria-hidden="true">+</span></summary><div>{entry.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></details></article>)}</div></section>)}
      {count === 0 && <div className="research-empty"><Search size={25} /><h2>暂时没有相关笔记</h2><p>换个关键词，或回到完整目录。</p><button type="button" onClick={() => { setQuery(''); setCategory('all'); }}>重置筛选</button></div>}
    </section><p className="research-disclosure">{type === 'ai' ? '本页为内容与实践框架示例，未接入实时产品资讯或实际评测结果。' : '本页为投资研究框架示例，仅用于学习与交流，不构成投资建议。未接入行情、账户或交易系统。'}</p>
  </div>;
}
