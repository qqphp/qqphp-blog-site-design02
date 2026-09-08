'use client';
import { CmsText } from '@/components/cms-text';

import { useContent } from '@/components/content-provider';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight, Copy, Check, Sparkles } from 'lucide-react';

import './ai-notebook.css';

export function AiNotebook() {
  const { aiNotes, prompt, pageSettings } = useContent();
  const promptRecipe = prompt.text;
  const [filter, setFilter] = useState('全部');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const notes = aiNotes.filter((note) => filter === '全部' || note.kind === filter);
  async function copyPrompt() {
    try { await navigator.clipboard.writeText(promptRecipe); setCopied(true); setCopyError(false); }
    catch { setCopyError(true); setCopied(false); }
  }

  return <div className="ai-notebook"><header className="ai-notebook-heading"><div><p><CmsText page="AI页面" name="01 WITH AI, BY ME / 开" /></p><h1><CmsText page="AI页面" name="02 AI 手记" /><span><CmsText page="AI页面" name="03 做点小东西，记点真问题。" /></span></h1></div><span className="ai-handstamp"><Sparkles size={16} /><CmsText page="AI页面" name="04 边用边想" /></span></header>
    <section className="ai-cover-story"><div className="ai-cover-art"><Image src={pageSettings.aiCover.src} alt={pageSettings.aiCover.alt} width={1881} height={836} priority /><span><CmsText page="AI页面" name="05 01 / 本站制作记录" /></span><div className="ai-material-samples" aria-hidden="true"><i>纸</i><i>光</i><i>形</i></div></div><div className="ai-cover-copy"><p className="ai-small-label"><CmsText page="AI页面" name="06 这次做了什么" /></p><h2><CmsText page="AI页面" name="07 给日常，" /><br /><CmsText page="AI页面" name="08 换三种风景。" /></h2><p><CmsText page="AI页面" name="09 把 AI 生成的图像放进博客：从风格" /></p><a href={pageSettings.aiCover.href} onClick={() => setFilter('全部')}><CmsText page="AI页面" name="10 翻开这次记录" /><ArrowUpRight size={18} /></a><Link href="/notes"><CmsText page="AI页面" name="11 也可以直接去说说看看 ↗" /></Link></div></section>
    <div className="ai-journal-layout"><section className="ai-journal" aria-label="AI 手记列表"><div className="ai-journal-title"><h2><CmsText page="AI页面" name="12 使用中的笔记" /></h2><span><CmsText page="AI页面" name="13 想法 / 尝试 / 发现" /></span></div><div className="ai-note-filters" aria-label="笔记类型">{['全部', ...new Set(aiNotes.map(note => note.kind))].map((kind) => <button key={kind} type="button" aria-pressed={filter === kind} onClick={() => setFilter(kind)}>{kind}</button>)}<output aria-live="polite">{notes.length} 篇</output></div>
      {notes.map((note) => <article id={`ai-note-${note.id}`} className="ai-journal-entry" key={note.id}><span className="ai-entry-number">{String(aiNotes.indexOf(note) + 1).padStart(2, '0')}</span><div><div className="ai-entry-meta"><span>{note.kind}</span><small>{note.status}</small></div><h3>{note.title}</h3><p>{note.summary}</p><details><summary><CmsText page="AI页面" name="14 继续读" /><span aria-hidden="true">+</span></summary><div className="ai-entry-prose">{note.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{note.href && <Link href={note.href}>{note.link} <ArrowUpRight size={14} /></Link>}</div></details></div></article>)}
    </section><aside className="ai-desk"><section className="ai-prompt-slip"><p className="ai-small-label"><CmsText page="AI页面" name="15 一张可以带走的便签" /></p><h2><CmsText page="AI页面" name="16 把想法变成" /><br /><CmsText page="AI页面" name="17 一个小任务。" /></h2><p><CmsText page="AI页面" name="18 替换方括号里的内容，再用自己的实际材" /></p><details><summary><CmsText page="AI页面" name="19 查看完整提示词" /><span aria-hidden="true">↗</span></summary><pre>{promptRecipe}</pre></details><button type="button" onClick={copyPrompt}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? '已复制' : '复制这张便签'}</button><output aria-live="polite">{copyError ? '复制未成功，请展开提示词手动选择复制。' : copied ? '可以粘贴到你使用的 AI 工具中。' : ''}</output></section>
      <section className="ai-question-list"><p className="ai-small-label"><CmsText page="AI页面" name="20 下次想试试" /></p><h2><CmsText page="AI页面" name="21 还没做完的问题" /></h2><ul><li><span>01</span><CmsText page="AI页面" name="22 同一个构图，只改变材质，会发生什么？" /></li><li><span>02</span><CmsText page="AI页面" name="23 把一篇长笔记变成一张易读的小卡片。" /></li><li><span>03</span><CmsText page="AI页面" name="24 给自己的常用提示词留一份修改记录。" /></li></ul><small><CmsText page="AI页面" name="25 选题草稿 · 尚未完成的实验" /></small></section>
      <p className="ai-editor-note"><CmsText page="AI页面" name="26 这里记录具体作品、使用方法和局限。制" /></p>
    </aside></div>
  </div>;
}
