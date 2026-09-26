'use client';

import { CmsText } from '@/components/cms-text';
import { InvestmentPond } from '@/components/investment-pond';
import { useContent } from '@/components/content-provider';
import { researchContent, type ResearchSection } from '@/lib/research-content';
import { Activity, ArrowDown, BookOpen, ChartNoAxesCombined, FlaskConical, MessageCircle, Search, X } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './research-hub.css';

const investmentCategories = [
  { id: 'trends', title: '技术分析', icon: ChartNoAxesCombined },
  { id: 'indicators', title: '技术指标', icon: Activity },
  { id: 'quant', title: '量化策略', icon: FlaskConical },
  { id: 'sharing', title: '投资分享', icon: MessageCircle },
] as const;

const investmentTitles: Record<string, string> = {
  trends: '技术分析',
  indicators: '技术指标',
  quant: '量化策略',
  review: '投资分享',
  sharing: '投资分享',
};

export function ResearchHub({ type }: { type: 'ai' | 'investing' }) {
  const { investing, pageSettings } = useContent();
  const page = type === 'investing' ? investing : researchContent.ai;
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const search = query.trim().toLowerCase();

  const sectionsForDisplay: ResearchSection[] = type === 'investing'
    ? page.sections.map((section) => ({
        ...section,
        id: section.id === 'review' ? 'sharing' : section.id,
        title: investmentTitles[section.id] ?? section.title,
      }))
    : page.sections;
  const visibleSections = sectionsForDisplay
    .filter((section) => category === 'all' || section.id === category)
    .map((section) => ({
      ...section,
      entries: section.entries.filter((entry) => [section.title, entry.title, entry.tag, entry.description, ...entry.paragraphs].join(' ').toLowerCase().includes(search)),
    }))
    .filter((section) => section.entries.length > 0);
  const count = visibleSections.reduce((sum, section) => sum + section.entries.length, 0);
  const total = sectionsForDisplay.reduce((sum, section) => sum + section.entries.length, 0);

  return (
    <div className={`research-hub research-${type}`}>
      {type === 'investing' ? (
        <>
          <header className="investment-heading">
            <h1 className="investment-pond-sr-only">投资研究</h1>
            <InvestmentPond />
          </header>
          <nav className="research-topic-grid investment-topic-grid" aria-label="投资研究栏目">
            {investmentCategories.map((item, index) => {
              const Icon = item.icon;
              const section = sectionsForDisplay.find((candidate) => candidate.id === item.id);
              const entryCount = section?.entries.length ?? 0;
              return (
                <button className={`investment-topic investment-topic-${item.id}`} type="button" key={item.id} aria-pressed={category === item.id} onClick={() => { setCategory(item.id); setQuery(''); }}>
                  <span className="investment-topic-index">0{index + 1}</span>
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
          <div className="research-overview"><section className="research-focus"><p className="research-eyebrow">从任务到方法</p><h2>先让一个小任务，变得更顺手。</h2><div className="research-steps">{['明确问题', '准备输入', '检查输出', '记录边界'].map((step, i) => <span key={step}><small>0{i + 1}</small>{step}</span>)}</div><a href="#research-library"><CmsText page="投资页" name="01 浏览研究目录" /><ArrowDown size={15} /></a></section><aside className="research-index-card"><BookOpen size={22} /><strong>{String(total).padStart(2, '0')}<small><CmsText page="投资页" name="02 篇示例笔记" /></small></strong><p>工作流、工具、提示词与学习路线，按主题收纳。</p><span>编辑示例 · 非实测工具榜单</span></aside></div>
          <div className="research-topic-grid" aria-label="主题板块">{page.sections.map((section, i) => <button type="button" key={section.id} aria-pressed={category === section.id} onClick={() => { setCategory(section.id); setQuery(''); }}><span>0{i + 1} / {section.entries.length} 篇</span><h2>{section.title}</h2><p>{section.description}</p></button>)}</div>
        </>
      )}

      <section id="research-library" className={`research-library${type === 'investing' ? ' investment-library' : ''}`} aria-label="研究目录">
        {type === 'investing' && <div className="investment-archive-heading"><span>投资研究 / {String(count).padStart(2, '0')}</span><h2>{category === 'all' ? '研究笔记' : investmentCategories.find((item) => item.id === category)?.title}</h2></div>}
        <div className="research-toolbar">
          <div><button type="button" aria-pressed={category === 'all'} onClick={() => setCategory('all')}><CmsText page="投资页" name="03 全部笔记" /></button>{category !== 'all' && <span>{(type === 'investing' ? investmentCategories.find((item) => item.id === category)?.title : sectionsForDisplay.find((section) => section.id === category)?.title)}</span>}<output aria-live="polite">{count} 篇</output></div>
          <label className="research-search"><Search size={16} /><input type="search" aria-label="搜索研究笔记" placeholder="搜索主题、关键词…" value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button type="button" aria-label="清空搜索" onClick={() => setQuery('')}><X size={16} /></button>}</label>
        </div>
        {visibleSections.map((section) => (
          <section className={`research-section${type === 'investing' ? ` investment-section investment-section-${section.id}` : ''}`} key={section.id}>
            <div className="research-section-heading"><span className="investment-section-code">{type === 'investing' ? investmentCategories.findIndex((item) => item.id === section.id) + 1 < 10 ? `0${investmentCategories.findIndex((item) => item.id === section.id) + 1}` : '' : ''}</span><h2>{section.title}</h2><p>{section.description}</p></div>
            <div className="research-entries">{section.entries.map((entry, index) => (
              <article className={type === 'investing' ? `investment-entry investment-entry-${section.id}` : undefined} key={entry.title}>
                <div className="investment-entry-overline"><span className="research-entry-tag">{entry.tag}</span>{type === 'investing' && <span>NOTE / {String(index + 1).padStart(2, '0')}</span>}</div>
                <h3>{entry.title}</h3><p>{entry.description}</p>
                <details><summary><CmsText page="投资页" name="04 展开笔记" /><span aria-hidden="true">+</span></summary><div className={type === 'investing' ? 'investment-markdown' : undefined}>{entry.paragraphs.map((paragraph, paragraphIndex) => type === 'investing' ? <ReactMarkdown key={`${entry.title}-${paragraphIndex}`} remarkPlugins={[remarkGfm]} skipHtml>{paragraph}</ReactMarkdown> : <p key={`${entry.title}-${paragraphIndex}`}>{paragraph}</p>)}</div></details>
              </article>
            ))}</div>
          </section>
        ))}
        {count === 0 && <div className="research-empty"><Search size={25} /><h2><CmsText page="投资页" name="05 暂时没有相关笔记" /></h2><p><CmsText page="投资页" name="06 换个关键词，或回到完整目录。" /></p><button type="button" onClick={() => { setQuery(''); setCategory('all'); }}><CmsText page="投资页" name="07 重置筛选" /></button></div>}
      </section>
      <p className="research-disclosure">{type === 'investing' ? pageSettings.investing.disclosure : '本页为内容与实践框架示例，未接入实时产品资讯或实际评测结果。'}</p>
    </div>
  );
}
