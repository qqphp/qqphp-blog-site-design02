'use client';

import { InvestmentPond } from '@/components/investment-pond';
import { useContent } from '@/components/content-provider';
import { researchContent, type ResearchSection } from '@/lib/research-content';
import { newestCreatedFirst } from '@/lib/content-times';
import { Activity, ArrowDown, BookOpen, ChartNoAxesCombined, FlaskConical, MessageCircle, Search, X, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './research-hub.css';

const investmentIcons: Record<string, LucideIcon> = {
  trends: ChartNoAxesCombined, indicators: Activity, quant: FlaskConical,
  review: MessageCircle, sharing: MessageCircle,
};

export function ResearchHub({ type }: { type: 'ai' | 'investing' }) {
  const { investing } = useContent();
  const page = type === 'investing' ? investing : researchContent.ai;
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const search = query.trim().toLowerCase();

  const sectionsForDisplay: ResearchSection[] = page.sections;
  const visibleSections = sectionsForDisplay
    .filter((section) => category === 'all' || section.id === category)
    .map((section) => ({
      ...section,
      entries: section.entries.filter((entry) => [section.title, entry.title, entry.tag, entry.description, ...entry.paragraphs].join(' ').toLowerCase().includes(search)),
    }))
    .filter((section) => section.entries.length > 0);
  const count = visibleSections.reduce((sum, section) => sum + section.entries.length, 0);
  const total = sectionsForDisplay.reduce((sum, section) => sum + section.entries.length, 0);
  const investmentEntries = type === 'investing' ? newestCreatedFirst(investing.sections
    .filter((section) => category === 'all' || section.id === category)
    .flatMap((section) => section.entries.map((entry) => ({
      id: `${section.id}:${entry.id}`,
      createdAt: entry.createdAt,
      entry,
    })))) : [];
  const activeEntry = investmentEntries.find((item) => item.id === selectedId) ?? investmentEntries[0];

  return (
    <div className={`research-hub research-${type}`}>
      {type === 'investing' ? (
        <>
          <header className="investment-heading">
            <h1 className="investment-pond-sr-only">投资研究</h1>
            <InvestmentPond />
          </header>
          <nav className="research-topic-grid investment-topic-grid" aria-label="投资研究栏目">
            {sectionsForDisplay.map((item, index) => {
              const Icon = investmentIcons[item.id] ?? BookOpen;
              const entryCount = item.entries.length;
              return (
                <button className={`investment-topic investment-topic-${item.id}`} type="button" key={item.id} aria-pressed={category === item.id} onClick={() => { setCategory(category === item.id ? 'all' : item.id); setSelectedId(null); }}>
                  <span className="investment-topic-index">{String(index + 1).padStart(2, '0')}</span>
                  <Icon className="investment-topic-icon" size={19} strokeWidth={1.6} aria-hidden="true" />
                  <span className="investment-topic-copy"><strong>{item.title}</strong><small>{entryCount ? `${entryCount} 篇笔记` : '持续整理中'}</small></span>
                </button>
              );
            })}
          </nav>
        </>
      ) : (
        <>
          <header className="research-heading"><div><p>{page.label}</p><h1>{page.title}</h1></div><span>{page.description}</span></header>
          <div className="research-overview"><section className="research-focus"><p className="research-eyebrow">从任务到方法</p><h2>先让一个小任务，变得更顺手。</h2><div className="research-steps">{['明确问题', '准备输入', '检查输出', '记录边界'].map((step, i) => <span key={step}><small>0{i + 1}</small>{step}</span>)}</div><a href="#research-library">浏览研究目录<ArrowDown size={15} /></a></section><aside className="research-index-card"><BookOpen size={22} /><strong>{String(total).padStart(2, '0')}<small>篇示例笔记</small></strong><p>工作流、工具、提示词与学习路线，按主题收纳。</p><span>编辑示例 · 非实测工具榜单</span></aside></div>
          <div className="research-topic-grid" aria-label="主题板块">{page.sections.map((section, i) => <button type="button" key={section.id} aria-pressed={category === section.id} onClick={() => { setCategory(section.id); setQuery(''); }}><span>0{i + 1} / {section.entries.length} 篇</span><h2>{section.title}</h2><p>{section.description}</p></button>)}</div>
        </>
      )}

      <section id="research-library" className={`research-library${type === 'investing' ? ' investment-library' : ''}`} aria-label="研究目录">
        {type === 'investing' ? (
          <div className="investment-reader">
            <nav className="investment-article-list" aria-label="投资文章列表">
              {investmentEntries.map(({ id, entry }) => (
                <button type="button" key={id} aria-pressed={activeEntry?.id === id} aria-controls="investment-article" onClick={() => setSelectedId(id)}>
                  {entry.title}
                </button>
              ))}
              {!investmentEntries.length && <p className="investment-empty">暂无文章</p>}
            </nav>
            <article id="investment-article" className="investment-article" aria-labelledby={activeEntry ? 'investment-article-title' : undefined}>
              {activeEntry ? (
                <>
                  <header className="investment-article-heading">
                    <h2 id="investment-article-title">{activeEntry.entry.title}</h2>
                    <p>{activeEntry.entry.description}</p>
                  </header>
                  <div className="investment-markdown">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>{activeEntry.entry.paragraphs.join('\n\n')}</ReactMarkdown>
                  </div>
                </>
              ) : <p className="investment-empty">暂无文章</p>}
            </article>
          </div>
        ) : (
        <>
        <div className="research-toolbar">
          <div><button type="button" aria-pressed={category === 'all'} onClick={() => setCategory('all')}>全部笔记</button>{category !== 'all' && <span>{sectionsForDisplay.find((section) => section.id === category)?.title}</span>}<output aria-live="polite">{count} 篇</output></div>
          <label className="research-search"><Search size={16} /><input type="search" aria-label="搜索研究笔记" placeholder="搜索主题、关键词…" value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button type="button" aria-label="清空搜索" onClick={() => setQuery('')}><X size={16} /></button>}</label>
        </div>
        {visibleSections.map((section) => (
          <section className="research-section" key={section.id}>
            <div className="research-section-heading"><span className="investment-section-code" /><h2>{section.title}</h2><p>{section.description}</p></div>
            <div className="research-entries">{section.entries.map((entry) => (
              <article key={entry.title}>
                <div className="investment-entry-overline"><span className="research-entry-tag">{entry.tag}</span></div>
                <h3>{entry.title}</h3><p>{entry.description}</p>
                <details><summary>展开笔记<span aria-hidden="true">+</span></summary><div>{entry.paragraphs.map((paragraph, paragraphIndex) => <p key={`${entry.title}-${paragraphIndex}`}>{paragraph}</p>)}</div></details>
              </article>
            ))}</div>
          </section>
        ))}
        {count === 0 && <div className="research-empty"><Search size={25} /><h2>暂时没有相关笔记</h2><p>换个关键词，或回到完整目录。</p><button type="button" onClick={() => { setQuery(''); setCategory('all'); }}>重置筛选</button></div>}
        </>
        )}
      </section>
      <p className="research-disclosure">{type === 'investing' ? '本页为投资研究框架示例，仅用于学习与交流，不构成投资建议。未接入行情、账户或交易系统。' : '本页为内容与实践框架示例，未接入实时产品资讯或实际评测结果。'}</p>
    </div>
  );
}
