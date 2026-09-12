import { Window } from 'happy-dom';
import { register } from 'node:module';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

register('./ui-test-loader.mjs', import.meta.url);
const window = new Window({ url: 'http://localhost:3000' });
const style = window.document.createElement('style');
style.textContent = readFileSync(
  new URL('../components/admin.css', import.meta.url),
  'utf8',
);
window.document.head.append(style);
for (const name of [
  'window',
  'document',
  'navigator',
  'localStorage',
  'HTMLElement',
  'HTMLInputElement',
  'HTMLTextAreaElement',
  'HTMLButtonElement',
  'HTMLSelectElement',
  'Element',
  'Node',
  'NodeFilter',
  'DocumentFragment',
  'Event',
  'MouseEvent',
  'KeyboardEvent',
  'PointerEvent',
  'FocusEvent',
  'MutationObserver',
  'ResizeObserver',
  'getComputedStyle',
  'requestAnimationFrame',
  'cancelAnimationFrame',
]) {
  const value = name === 'window' ? window : window[name];
  Object.defineProperty(globalThis, name, {
    value:
      typeof value === 'function' && !/^[A-Z]/.test(name)
        ? value.bind(window)
        : value,
    configurable: true,
  });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createElement: h, useState } = await import('react');
const { render, screen, cleanup, waitFor, within, fireEvent } =
  await import('@testing-library/react');
const { default: userEvent } = await import('@testing-library/user-event');

const { AdminWritingManager } =
  await import('../components/admin-writing-manager.tsx');
const { AdminProjectManager } =
  await import('../components/admin-project-manager.tsx');
const { defaults } = await import('../lib/cms-defaults.ts');
const { resolveProjects } = await import('../lib/project-content.ts');
const { stripArticleExtras } = await import('../lib/article-categories.ts');
const { validateContent } = await import('../lib/cms-validation.ts');
const user = userEvent.setup({ document: window.document });
try {
  let articles = ['2020.01.01', '2026.09.11', '2024.08.03'].map((date, i) => ({
    ...defaults.writing[0],
    slug: 'article-' + i,
    title: '文章' + i,
    date,
  }));
  const original = structuredClone(articles);
  let view;
  const articleProps = () => ({
    articles,
    categories: defaults.categories,
    busy: false,
    onWorking: () => {},
    onChange: (next) => {
      articles = next;
      view.rerender(h(AdminWritingManager, articleProps()));
    },
  });
  view = render(h(AdminWritingManager, articleProps()));
  const titles = () =>
    Array.from(document.querySelectorAll('tbody tr')).map(
      (row) => row.cells[0].querySelector('button').textContent,
    );
  assert.deepEqual(titles(), ['文章1', '文章2', '文章0']);
  assert.deepEqual(articles, original);
  await user.click(
    within(document.querySelector('tbody tr')).getByRole('button', {
      name: '编辑',
    }),
  );
  for (const label of ['内容标签', '主题标签', '阅读时长'])
    assert.equal(screen.queryByLabelText(label), null);
  await user.type(screen.getByLabelText('文章标题'), '已修改');
  assert.equal(articles[1].title, '文章1已修改');
  assert.equal(articles[0].title, '文章0');
  await user.click(screen.getByRole('button', { name: '← 返回文章表格' }));
  assert.equal(titles()[0], '文章1已修改');
  cleanup();
  assert.deepEqual(
    stripArticleExtras({
      title: '保留',
      label: '旧内容标签',
      tag: '旧主题标签',
      meta: '9 分钟',
    }),
    { title: '保留' },
  );
  let projects = {
    ...structuredClone(defaults.projects),
    items: ['2020-01-01T00:00:00.000Z', '2026-09-11T00:00:00.000Z', ''].map(
      (createdAt, i) => ({
        ...structuredClone(defaults.projects.items[0]),
        id: 'project-' + i,
        title: '项目' + i,
        createdAt,
      }),
    ),
  };
  const projectProps = () => ({
    value: projects,
    onChange: (next) => {
      projects = next;
      view.rerender(h(AdminProjectManager, projectProps()));
    },
  });
  view = render(h(AdminProjectManager, projectProps()));
  assert.ok(titles()[0].startsWith('项目1'));
  assert.ok(titles()[2].startsWith('项目2'));
  await user.click(
    within(document.querySelector('tbody tr')).getByRole('button', {
      name: '编辑',
    }),
  );
  await user.type(screen.getByLabelText('项目名称'), '已修改');
  assert.equal(projects.items[1].title, '项目1已修改');
  assert.equal(projects.items[1].createdAt, '2026-09-11T00:00:00.000Z');
  fireEvent.change(screen.getByLabelText('创建时间'), {
    target: { value: '2027-01-02T03:04:05' },
  });
  assert.equal(
    projects.items[1].createdAt,
    new Date('2027-01-02T03:04:05').toISOString(),
  );
  await user.click(screen.getByRole('button', { name: '← 返回项目表格' }));
  const before = Date.now();
  await user.click(screen.getByRole('button', { name: /新增项目/ }));
  assert.ok(Date.parse(projects.items.at(-1).createdAt) >= before);
  cleanup();
  const legacy = structuredClone(defaults.projects);
  delete legacy.items[0].createdAt;
  assert.equal(resolveProjects(legacy).items[0].createdAt, '');
  const invalid = structuredClone(defaults.projects);
  invalid.items[0].createdAt = 'not-a-date';
  assert.throws(() => validateContent('projects', invalid), /创建时间/);
  const { default: WritingPage } = await import('../app/writing/page.tsx');
  const { ContentProvider } =
    await import('../components/content-provider.tsx');
  render(
    h(
      ContentProvider,
      {
        content: {
          ...defaults,
          writing: [
            {
              ...defaults.writing[0],
              label: 'REMOVED_CONTENT_LABEL',
              tag: 'REMOVED_TOPIC_TAG',
              meta: 'REMOVED_READ_TIME',
            },
          ],
        },
      },
      h(WritingPage),
    ),
  );
  for (const text of [
    'REMOVED_CONTENT_LABEL',
    'REMOVED_TOPIC_TAG',
    'REMOVED_READ_TIME',
  ])
    assert.equal(screen.queryByText(text), null);
  cleanup();
  console.log(
    'PASS descending dates, unchanged source order, correct edit targets, new/stable project creation time, legacy timestamps and removed article fields',
  );
  const publicArticles = ['2024.12.31', '2026.09.11', '2025.01.01'].map(
    (date, index) => ({
      ...defaults.writing[0],
      slug: `public-${index}`,
      title: `排序验证 ${index}`,
      date,
    }),
  );
  const sourceOrder = structuredClone(publicArticles);
  render(h(ContentProvider, {
    content: { ...defaults, writing: publicArticles },
  }, h(WritingPage)));
  const publicTitles = () => Array.from(
    document.querySelectorAll('.writing-list-item h2'),
    (element) => element.textContent,
  );
  assert.deepEqual(publicTitles(), ['排序验证 1', '排序验证 2', '排序验证 0']);
  assert.deepEqual(publicArticles, sourceOrder);
  await user.type(screen.getByRole('textbox', { name: '搜索文章' }), '排序验证');
  assert.deepEqual(publicTitles(), ['排序验证 1', '排序验证 2', '排序验证 0']);
  await user.clear(screen.getByRole('textbox', { name: '搜索文章' }));
  await user.type(screen.getByRole('textbox', { name: '搜索文章' }), '无匹配文章');
  assert.deepEqual(publicTitles(), []);
  assert.ok(screen.getByText('没有找到匹配的文章，换个关键词试试。'));
  console.log('PASS public writing publication order, search order, empty results and unchanged source data');
} finally {
  cleanup();
  window.happyDOM.abort();
}
