'use client';

import type { ReactNode } from 'react';
import {
  BookOpen,
  Film,
  Headphones,
  Map,
  Mic,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { CmsText } from '@/components/cms-text';

export type LifeHeaderKind =
  | 'music'
  | 'films'
  | 'podcasts'
  | 'travel'
  | 'hobbies'
  | 'books';

type HeaderNote = {
  icon: LucideIcon;
  page: '生活栏目' | '书籍页';
  lines: [string, string];
  meta: string;
};

const headerNotes: Record<LifeHeaderKind, HeaderNote> = {
  music: {
    icon: Headphones,
    page: '生活栏目',
    lines: ['22 让声音留在日常里，', '23 也留一点空白给自己。'],
    meta: '24 原创合成 · 顺序循环',
  },
  films: {
    icon: Film,
    page: '生活栏目',
    lines: ['25 电影散场以后，', '26 故事仍在心里继续。'],
    meta: '27 虚构短片 · 视觉练习',
  },
  podcasts: {
    icon: Mic,
    page: '生活栏目',
    lines: ['28 给问题多一点时间，', '29 给不同声音一个座位。'],
    meta: '30 虚构对话 · 暂无音频',
  },
  travel: {
    icon: Map,
    page: '生活栏目',
    lines: ['31 走得慢一点，', '32 沿途才会真正出现。'],
    meta: '33 想象路线 · 出发前请核实',
  },
  hobbies: {
    icon: Sparkles,
    page: '生活栏目',
    lines: ['34 不为擅长，', '35 只是愿意再次开始。'],
    meta: '36 轻量练习 · 随时开始',
  },
  books: {
    icon: BookOpen,
    page: '书籍页',
    lines: ['07 一本一本地读，', '08 一点一点地积累。'],
    meta: '09 书籍与书单 · 持续整理',
  },
};

export function LifePageHeader({
  kind,
  title,
  intro,
}: {
  kind: LifeHeaderKind;
  title: ReactNode;
  intro: ReactNode;
}) {
  const note = headerNotes[kind];
  const Icon = note.icon;

  return (
    <header className="life-page-heading">
      <div className="life-page-heading-main">
        <p className="life-overline">
          <CmsText page="生活栏目" name="20 OFF THE CLOCK / 生活" />
        </p>
        <h1>{title}</h1>
        <p>{intro}</p>
      </div>
      <aside className="life-page-heading-aside">
        <Icon size={30} strokeWidth={1} aria-hidden="true" />
        <p>
          <CmsText page={note.page} name={note.lines[0]} />
          <br />
          <CmsText page={note.page} name={note.lines[1]} />
        </p>
        <span>
          <CmsText page={note.page} name={note.meta} />
        </span>
      </aside>
    </header>
  );
}
