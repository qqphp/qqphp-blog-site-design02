'use client';

import { useState } from 'react';
import type { Json } from '@/lib/cms-validation';
import { Field } from './admin-fields';

type PageGroup = {
  name: string;
  href: string;
  description: string;
  keys: string[];
};
const settingsPages: PageGroup[] = [
  {
    name: '写作页',
    href: '/writing',
    description: '页面标题与简介',
    keys: ['writing'],
  },
  {
    name: '项目页',
    href: '/projects',
    description: '页面标题与简介',
    keys: ['projects'],
  },
  {
    name: 'AI 手记',
    href: '/ai',
    description: '重点配图与跳转链接',
    keys: ['aiCover'],
  },
  {
    name: '投资研究',
    href: '/investing',
    description: '标题、研究步骤与说明',
    keys: ['investing'],
  },
  { name: '电影页', href: '/films', description: '栏目介绍', keys: ['films'] },
  {
    name: '播客页',
    href: '/podcasts',
    description: '栏目介绍',
    keys: ['podcasts'],
  },
  {
    name: '旅行页',
    href: '/travel',
    description: '栏目介绍',
    keys: ['travel'],
  },
  {
    name: '爱好页',
    href: '/hobbies',
    description: '栏目介绍',
    keys: ['hobbies'],
  },
];
const copyPages: PageGroup[] = [
  {
    name: '首页',
    href: '/',
    description: '首页栏目与装饰文字',
    keys: ['首页栏目', '首页装饰'],
  },
  {
    name: '写作页',
    href: '/writing',
    description: '列表、分类与提示语',
    keys: ['写作页'],
  },
  {
    name: '项目页',
    href: '/projects',
    description: '项目展示与详情文案',
    keys: ['项目页'],
  },
  {
    name: '说说页',
    href: '/notes',
    description: '个人介绍、封面与图库',
    keys: ['说说页', '说说封面', '说说图库'],
  },
  {
    name: 'AI 手记',
    href: '/ai',
    description: '介绍、便签与使用说明',
    keys: ['AI页面'],
  },
  {
    name: '投资研究',
    href: '/investing',
    description: '研究目录与提示语',
    keys: ['投资页'],
  },
  {
    name: '关于页',
    href: '/about',
    description: '个人介绍、服务与联系文案',
    keys: ['关于页'],
  },
  {
    name: '书签页',
    href: '/bookmarks',
    description: '收藏目录与提示语',
    keys: ['书签页'],
  },
  {
    name: '友链页',
    href: '/friends',
    description: '友链介绍与访问说明',
    keys: ['友链页'],
  },
  {
    name: '书籍页',
    href: '/books',
    description: '阅读介绍、书架与书单',
    keys: ['书籍页'],
  },
  {
    name: '生活栏目通用',
    href: '/music',
    description: '音乐、电影、播客、旅行与爱好共用',
    keys: ['生活栏目'],
  },
  {
    name: '全站播放器',
    href: '/music',
    description: '跨页面共用的播放说明',
    keys: ['音乐播放器'],
  },
  {
    name: '全站导航',
    href: '/',
    description: '网站与生活导航菜单',
    keys: ['导航菜单'],
  },
];
const groupLabels: Record<string, string> = {
  writing: '标题与简介',
  projects: '标题与简介',
  aiCover: '重点配图',
  investing: '研究介绍',
  films: '栏目介绍',
  podcasts: '栏目介绍',
  travel: '栏目介绍',
  travelCover: '重点配图',
  hobbies: '栏目介绍',
};

export function AdminPageEditor({
  section,
  value,
  sample,
  saved,
  onChange,
}: {
  section: 'pageSettings' | 'copy';
  value: Record<string, Json>;
  sample: Record<string, Json>;
  saved: Record<string, Json>;
  onChange: (value: Json) => void;
}) {
  const [selected, setSelected] = useState(0);
  const pages = section === 'pageSettings' ? settingsPages : copyPages;
  const page = pages[selected];
  return (
    <div className="admin-page-editor">
      <div
        role="navigation"
        className="admin-records admin-page-list"
        aria-label="选择要编辑的页面"
      >
        <div className="admin-page-list-heading">
          <strong>选择页面</strong>
          <small>{pages.length} 个入口</small>
        </div>
        {pages.map((item, index) => {
          const changed = item.keys.some(
            (key) => JSON.stringify(value[key]) !== JSON.stringify(saved[key]),
          );
          return (
            <button
              type="button"
              className="admin-record"
              aria-pressed={selected === index}
              key={item.name}
              onClick={() => setSelected(index)}
            >
              <strong>
                {item.name}
                {changed && <span className="admin-page-dirty">未保存</span>}
              </strong>
              <small>{item.description}</small>
            </button>
          );
        })}
      </div>
      <section className="admin-form" aria-label={`${page.name}编辑区`}>
        <header className="admin-page-heading">
          <div>
            <p>当前编辑页面</p>
            <h2>{page.name}</h2>
            <span>{page.description}</span>
          </div>
          <a href={page.href} target="_blank" rel="noreferrer">
            查看页面 ↗<small>{page.href}</small>
          </a>
        </header>
        <p className="admin-page-help">
          切换页面会保留当前修改；「保存栏目」会一次保存本栏目中所有页面的修改。
        </p>
        {page.keys.map((key) => (
          <Field
            key={`${section}.${key}`}
            path={`${section}.${key}`}
            label={groupLabels[key] || key}
            value={value[key]}
            sample={sample[key]}
            onChange={(next) => onChange({ ...value, [key]: next })}
          />
        ))}
      </section>
    </div>
  );
}
