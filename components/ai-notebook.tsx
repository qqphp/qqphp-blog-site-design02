'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight, Copy, Check, Sparkles } from 'lucide-react';
import { aiNotes, promptRecipe } from '@/lib/ai-notebook';
import './ai-notebook.css';

export function AiNotebook() {
  const [filter, setFilter] = useState('全部');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const notes = aiNotes.filter((note) => filter === '全部' || note.kind === filter);
  async function copyPrompt() {
    try { await navigator.clipboard.writeText(promptRecipe); setCopied(true); setCopyError(false); }
    catch { setCopyError(true); setCopied(false); }
  }

  return <div className="ai-notebook"><header className="ai-notebook-heading"><div><p>WITH AI, BY ME / 开发阿雷</p><h1>AI 手记<span>做点小东西，记点真问题。</span></h1></div><span className="ai-handstamp"><Sparkles size={16} />边用边想</span></header>
    <section className="ai-cover-story"><div className="ai-cover-art"><Image src="/notes/paper-v2.png" alt="本站说说封面的 AI 纸艺山水实验" width={1881} height={836} priority /><span>01 / 本站制作记录</span><div className="ai-material-samples" aria-hidden="true"><i>纸</i><i>光</i><i>形</i></div></div><div className="ai-cover-copy"><p className="ai-small-label">这次做了什么</p><h2>给日常，<br />换三种风景。</h2><p>把 AI 生成的图像放进博客：从风格选择，到横幅裁切，再到三条小小的切换线。</p><a href="#ai-note-cover" onClick={() => setFilter('全部')}>翻开这次记录 <ArrowUpRight size={18} /></a><Link href="/notes">也可以直接去说说看看 ↗</Link></div></section>
    <div className="ai-journal-layout"><section className="ai-journal" aria-label="AI 手记列表"><div className="ai-journal-title"><h2>使用中的笔记</h2><span>想法 / 尝试 / 发现</span></div><div className="ai-note-filters" aria-label="笔记类型">{['全部', '小作品', '用法笔记', '踩坑记录'].map((kind) => <button key={kind} type="button" aria-pressed={filter === kind} onClick={() => setFilter(kind)}>{kind}</button>)}<output aria-live="polite">{notes.length} 篇</output></div>
      {notes.map((note) => <article id={`ai-note-${note.id}`} className="ai-journal-entry" key={note.id}><span className="ai-entry-number">{String(aiNotes.indexOf(note) + 1).padStart(2, '0')}</span><div><div className="ai-entry-meta"><span>{note.kind}</span><small>{note.status}</small></div><h3>{note.title}</h3><p>{note.summary}</p><details><summary>继续读 <span aria-hidden="true">+</span></summary><div className="ai-entry-prose">{note.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{note.href && <Link href={note.href}>{note.link} <ArrowUpRight size={14} /></Link>}</div></details></div></article>)}
    </section><aside className="ai-desk"><section className="ai-prompt-slip"><p className="ai-small-label">一张可以带走的便签</p><h2>把想法变成<br />一个小任务。</h2><p>替换方括号里的内容，再用自己的实际材料试一试。</p><details><summary>查看完整提示词 <span aria-hidden="true">↗</span></summary><pre>{promptRecipe}</pre></details><button type="button" onClick={copyPrompt}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? '已复制' : '复制这张便签'}</button><output aria-live="polite">{copyError ? '复制未成功，请展开提示词手动选择复制。' : copied ? '可以粘贴到你使用的 AI 工具中。' : ''}</output></section>
      <section className="ai-question-list"><p className="ai-small-label">下次想试试</p><h2>还没做完的问题</h2><ul><li><span>01</span>同一个构图，只改变材质，会发生什么？</li><li><span>02</span>把一篇长笔记变成一张易读的小卡片。</li><li><span>03</span>给自己的常用提示词留一份修改记录。</li></ul><small>选题草稿 · 尚未完成的实验</small></section>
      <p className="ai-editor-note">这里记录具体作品、使用方法和局限。制作记录与示例方案分别标注，保留过程，也保留不确定。</p>
    </aside></div>
  </div>;
}
