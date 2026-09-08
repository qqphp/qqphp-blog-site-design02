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
const lifeCss = readFileSync(
  new URL('../components/life.css', import.meta.url),
  'utf8',
);
window.document.head.append(style);
for (const name of [
  'window',
  'document',
  'navigator',
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
const { AdminModelSelect } =
  await import('../components/admin-model-select.tsx');
const { AdminAiSettings } = await import('../components/admin-ai-settings.tsx');
const { AdminCategoryManager } =
  await import('../components/admin-category-manager.tsx');
const { AdminWritingManager } =
  await import('../components/admin-writing-manager.tsx');
const { AdminProjectManager } =
  await import('../components/admin-project-manager.tsx');
const { WritingCategoryTree } =
  await import('../components/writing-category-tree.tsx');
const { migrateProjects } = await import('../lib/project-content.ts');
const { AdminPanel } = await import('../components/admin-panel.tsx');
const { ContentProvider } = await import('../components/content-provider.tsx');
const { LifePageHeader } = await import('../components/life-page-header.tsx');
const { AdminMarkdownEditor } =
  await import('../components/admin-markdown-editor.tsx');
const { defaults } = await import('../lib/cms-defaults.ts');
const user = userEvent.setup({ document: window.document });
const categories = [
  { id: 'root', parentId: '', name: '开发', description: '' },
  { id: 'child', parentId: 'root', name: '前端', description: '' },
];
const article = {
  slug: 'ui-check',
  title: '测试文章',
  excerpt: '摘要',
  body: '## 正文',
  categoryId: 'child',
  category: '前端',
  date: '2026.09.08',
  cover: '',
  coverMode: 'upload',
  coverGeneratedFor: '',
  _published: false,
  label: '',
  tag: '',
  meta: '',
};
try {
  const mockDocuments = structuredClone(defaults);
  const calls = [];
  let failImage = false;
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    if (url === '/api/admin/media' && init?.method === 'POST')
      return Response.json({ url: '/api/media/uploaded-story.png' });
    if (url === '/api/admin/session')
      return Response.json({ authenticated: true, configured: true });
    if (url === '/api/admin/content' && init?.method === 'PUT') {
      const body = JSON.parse(init.body);
      calls.push(body);
      mockDocuments[body.key] = body.value;
      return Response.json({ revision: 1 });
    }
    if (url === '/api/admin/content')
      return Response.json({ content: mockDocuments, revisions: {} });
    if (url === '/api/admin/ai') {
      const body = init?.body ? JSON.parse(init.body) : null;
      if (!body) return Response.json({ keyConfigured: true });
      if (failImage)
        return Response.json({ error: '模拟图片生成失败' }, { status: 502 });
      calls.push(body);
      return Response.json({
        url: '/api/media/generated.png',
        generatedFor: JSON.stringify([body.title, body.subtitle, body.excerpt]),
      });
    }
    throw Error('Unexpected test URL');
  };
  render(h(AdminPanel));
  await screen.findByRole('tab', { name: '文章管理' });
  const adminNavigation = within(
    screen.getByRole('navigation', { name: '后台栏目' }),
  );
  assert.ok(adminNavigation.getByRole('button', { name: '关于' }));
  assert.equal(
    adminNavigation.queryByRole('button', { name: '个人资料' }),
    null,
  );
  const websiteGroup = adminNavigation
    .getByText('网站', { selector: '.admin-nav-group-label' })
    .closest('.admin-nav-group');
  assert.ok(within(websiteGroup).getByRole('button', { name: /书签/ }));
  assert.ok(within(websiteGroup).getByRole('button', { name: /友链/ }));
  const lifeGroup = adminNavigation
    .getByText('生活', { selector: '.admin-nav-group-label' })
    .closest('.admin-nav-group');
  assert.ok(within(lifeGroup).getByRole('button', { name: /音乐/ }));
  assert.ok(within(lifeGroup).getByRole('button', { name: /电影/ }));
  assert.equal(
    within(screen.getByRole('navigation', { name: '后台栏目' })).queryByRole(
      'button',
      { name: /文章分类/ },
    ),
    null,
  );
  await user.click(
    screen.getAllByRole('button', { name: '编辑', exact: true })[0],
  );
  await user.type(screen.getByLabelText('文章标题'), ' 标签保留');
  await user.click(screen.getByRole('tab', { name: '文章分类' }));
  assert.ok(screen.getByLabelText('分类名称'));
  await user.type(screen.getByLabelText('分类名称'), ' 分类修改');
  await user.click(screen.getByRole('tab', { name: '文章管理' }));
  assert.ok(
    screen.getByRole('button', {
      name: mockDocuments.writing[0].title + ' 标签保留',
      exact: true,
    }),
  );
  await user.click(screen.getByRole('tab', { name: '文章分类' }));
  assert.match(screen.getByLabelText('分类名称').value, /分类修改/);
  window.confirm = () => true;
  await user.click(
    within(screen.getByRole('navigation', { name: '后台栏目' })).getByRole(
      'button',
      { name: `项目 ${mockDocuments.projects.items.length}` },
    ),
  );
  await user.click(
    screen.getAllByRole('button', { name: '编辑', exact: true })[0],
  );
  assert.equal(screen.getByLabelText('标签').closest('details'), null);
  await user.type(screen.getByLabelText('标签'), '独立标签{Enter}');
  assert.ok(screen.getByRole('button', { name: '移除标签 独立标签' }));
  assert.equal(
    window.getComputedStyle(
      window.document.querySelector('.admin-project-images'),
    ).borderTopWidth,
    '0px',
  );
  await user.click(screen.getAllByRole('radio', { name: 'AI 生成' })[0]);
  await user.click(
    screen.getByRole('button', { name: '保存栏目', exact: true }),
  );
  await waitFor(() =>
    assert.ok(calls.some((call) => call.action === 'project-cover')),
  );
  await waitFor(() => assert.ok(calls.some((call) => call.key === 'projects')));
  const imageRequest = calls.find((call) => call.action === 'project-cover');
  assert.equal(imageRequest.title, mockDocuments.projects.items[0].title);
  assert.equal(imageRequest.subtitle, mockDocuments.projects.items[0].subtitle);
  assert.equal(
    imageRequest.excerpt,
    mockDocuments.projects.items[0].description,
  );
  assert.equal(
    mockDocuments.projects.items[0].images[0].src,
    '/api/media/generated.png',
  );
  failImage = true;
  await user.click(screen.getByRole('button', { name: '重新生成图片' }));
  await screen.findByText(/模拟图片生成失败/);
  assert.equal(
    window.document
      .querySelector('.admin-project-images img')
      .getAttribute('src'),
    '/api/media/generated.png',
  );
  failImage = false;
  const sidebar = within(screen.getByRole('navigation', { name: '后台栏目' }));
  assert.equal(sidebar.queryByRole('button', { name: /说说封面/ }), null);
  await user.click(
    sidebar.getByRole('button', {
      name: `说说 ${mockDocuments.stories.length}`,
    }),
  );
  assert.ok(screen.getByRole('table'));
  const storySearch = screen.getByRole('searchbox', { name: '搜索说说' });
  const storyStatusFilter = screen.getByLabelText('按发布状态筛选说说');
  assert.equal(storySearch.nextElementSibling, storyStatusFilter);
  assert.equal(
    window.getComputedStyle(storySearch.closest('.admin-story-toolbar'))
      .display,
    'grid',
  );
  await user.selectOptions(storyStatusFilter, 'draft');
  assert.equal(screen.getAllByRole('row').length, 1);
  assert.ok(screen.getByText('没有符合筛选条件的说说。'));
  await user.selectOptions(storyStatusFilter, 'all');
  await user.click(
    screen.getAllByRole('button', { name: '编辑', exact: true })[0],
  );
  await user.type(screen.getByLabelText('文字'), ' 说说草稿');
  assert.equal(
    screen.getByLabelText('发布日期（北京时间）').type,
    'datetime-local',
  );
  assert.equal(screen.getByLabelText('发布日期（北京时间）').step, '1');
  fireEvent.change(screen.getByLabelText('发布日期（北京时间）'), {
    target: { value: '2026-09-08T12:34:56' },
  });
  await user.type(screen.getByLabelText('话题'), '##第二话题{Enter}');
  await user.type(screen.getByLabelText('话题'), '第三话题{Enter}');
  assert.ok(screen.getByRole('button', { name: '移除话题 第三话题' }));
  assert.equal(
    window.getComputedStyle(
      screen.getByLabelText('发布日期（北京时间）').parentElement,
    ).maxWidth,
    '320px',
  );
  assert.equal(
    window.getComputedStyle(
      screen.getByLabelText('话题').closest('.admin-tags'),
    ).maxWidth,
    '420px',
  );
  assert.equal(
    window.document
      .querySelector('.admin-story-editor > .admin-field')
      .nextElementSibling.getAttribute('aria-label'),
    '说说图片',
  );
  await user.upload(
    screen.getByLabelText('上传图片'),
    new window.File(['test-image'], 'test.png', { type: 'image/png' }),
  );
  await screen.findByText('图片已加入，保存栏目后生效。');
  assert.ok(
    window.document.querySelector('img[src="/api/media/uploaded-story.png"]'),
  );
  await user.click(screen.getByRole('button', { name: 'AI 生成图片' }));
  await screen.findByText('图片已加入，保存栏目后生效。');
  assert.ok(
    calls.some(
      (call) =>
        call.action === 'story-image' && call.excerpt.includes('说说草稿'),
    ),
  );
  await user.click(screen.getByRole('tab', { name: '说说封面' }));
  assert.ok(screen.getByText('说说封面', { selector: 'legend' }));
  await user.click(screen.getByRole('tab', { name: '说说列表' }));
  assert.ok(screen.getByText(/说说草稿/));
  await user.click(
    screen.getByRole('button', { name: '保存栏目', exact: true }),
  );
  await waitFor(() => assert.ok(calls.some((call) => call.key === 'stories')));
  assert.equal(mockDocuments.stories[0].date, '2026-09-08T12:34:56+08:00');
  assert.ok(mockDocuments.stories[0].topics.includes('第三话题'));
  assert.equal(
    mockDocuments.stories[0].images.at(-1).src,
    '/api/media/generated.png',
  );
  assert.equal(screen.queryByRole('button', { name: '评论与回复' }), null);
  await user.click(screen.getByRole('button', { name: '＋ 新增说说' }));
  assert.equal(screen.getByLabelText('发布状态').value, 'draft');
  await user.selectOptions(screen.getByLabelText('发布状态'), 'published');
  assert.equal(screen.getByLabelText('发布状态').value, 'published');
  await user.selectOptions(screen.getByLabelText('发布状态'), 'draft');
  await user.type(screen.getByLabelText('文字'), '新建默认草稿');
  fireEvent.change(screen.getByLabelText('发布日期（北京时间）'), {
    target: { value: '2030-01-01T00:00:01' },
  });
  await user.click(
    screen.getByRole('button', { name: '保存栏目', exact: true }),
  );
  await waitFor(() =>
    assert.equal(mockDocuments.stories.at(-1).text, '新建默认草稿'),
  );
  assert.equal(mockDocuments.stories.at(-1)._published, false);
  await user.click(screen.getByRole('button', { name: '← 返回说说列表' }));
  assert.match(screen.getAllByRole('row')[1].textContent, /新建默认草稿/);
  // Editing the displayed first row must update its ID, not the first saved record.
  await user.click(
    within(screen.getAllByRole('row')[1]).getByRole('button', {
      name: '编辑',
      exact: true,
    }),
  );
  assert.equal(screen.getByLabelText('文字').value, '新建默认草稿');
  console.log(
    'PASS default saved draft, newest-first admin rows, normalized topics and compact fields',
  );
  console.log(
    'PASS story table, tabs, second precision, topics, images and removed comment entry',
  );
  cleanup();
  globalThis.fetch = realFetch;
  console.log(
    'PASS merged writing tabs retain drafts; project tags and frameless images; automatic AI generation on save',
  );
  const lifeHeaders = [
    ['music', '音乐', '让声音留在日常里，也留一点空白给自己。'],
    ['films', '电影', '电影散场以后，故事仍在心里继续。'],
    ['podcasts', '播客', '给问题多一点时间，给不同声音一个座位。'],
    ['travel', '旅行', '走得慢一点，沿途才会真正出现。'],
    ['hobbies', '爱好', '不为擅长，只是愿意再次开始。'],
    ['books', '书籍', '一本一本地读，一点一点地积累。'],
  ];
  render(
    h(
      ContentProvider,
      { content: defaults },
      h(
        'div',
        null,
        ...lifeHeaders.map(([kind, title]) =>
          h(LifePageHeader, {
            key: kind,
            kind,
            title,
            intro: `${title}页面简介`,
          }),
        ),
      ),
    ),
  );
  for (const [, title, copy] of lifeHeaders) {
    const header = screen
      .getByRole('heading', { name: title })
      .closest('header');
    assert.ok(
      within(header)
        .getByRole('complementary')
        .textContent.replace(/\s+/g, '')
        .includes(copy),
    );
  }
  assert.match(
    lifeCss,
    /@media \(max-width: 700px\)[\s\S]*?\.life-page-heading-aside \{ display: none; \}/,
  );
  cleanup();
  console.log(
    'PASS shared life headers include per-page aside copy and hide the aside on mobile',
  );
  render(
    h(
      'div',
      { className: 'admin-shell' },
      h(AdminMarkdownEditor, {
        label: '预览测试',
        value: '1. 有序项\n2. 第二项\n\n- 无序项\n  - 嵌套项\n\n- [ ] 任务项',
        onChange: () => {},
      }),
    ),
  );
  const preview = window.document.querySelector('.wmde-markdown');
  assert.equal(
    window.getComputedStyle(preview.querySelector('ol')).listStyleType,
    'decimal',
  );
  assert.equal(
    window.getComputedStyle(preview.querySelector('ul')).listStyleType,
    'disc',
  );
  assert.equal(
    window.getComputedStyle(preview.querySelector('ul ul')).listStyleType,
    'circle',
  );
  assert.equal(
    window.getComputedStyle(preview.querySelector('li')).display,
    'list-item',
  );
  assert.equal(
    window.getComputedStyle(preview.querySelector('.task-list-item'))
      .listStyleType,
    'none',
  );
  cleanup();
  console.log('PASS Markdown ordered, unordered, nested and task list styles');
  let picked = '';
  render(
    h(WritingCategoryTree, {
      categories: [
        ...categories,
        { id: 'empty', parentId: 'child', name: '空分类' },
      ],
      articles: [article],
      selected: '',
      onSelect: (id) => {
        picked = id;
      },
    }),
  );
  const emptyCategory = screen.getByRole('button', { name: '空分类 0' });
  assert.equal(emptyCategory.closest('ul').parentElement.tagName, 'LI');
  await user.click(emptyCategory);
  assert.equal(picked, 'empty');
  assert.ok(screen.getByRole('button', { name: '开发 1' }));
  cleanup();
  console.log(
    'PASS public category tree includes empty descendants and aggregates parent article counts',
  );
  const legacyProject = {
    id: 'demo',
    title: '测试项目',
    subtitle: '副标题',
    status: '进行中',
    category: '工具',
    year: '2026',
    role: '开发',
    description: '摘要',
    images: [{ src: '/test.png', alt: '', label: '' }],
    tags: [],
    number: '01',
    question: '旧问题',
    decisions: [],
    steps: [],
    next: '旧下一步',
  };
  const migratedProjects = migrateProjects([legacyProject]);
  for (const key of ['number', 'question', 'decisions', 'steps', 'next'])
    assert.ok(!(key in migratedProjects.items[0]));
  function Projects() {
    const [value, set] = useState(migratedProjects);
    return h(AdminProjectManager, { value, onChange: set });
  }
  render(h(Projects));
  assert.ok(screen.getByRole('table'));
  await user.click(screen.getByRole('tab', { name: '项目状态' }));
  const statusInput = screen.getByLabelText('项目状态 1');
  await user.clear(statusInput);
  await user.type(statusInput, '维护中');
  assert.equal(
    screen.getByRole('button', { name: '删除维护中' }).disabled,
    true,
  );
  await user.click(screen.getByRole('tab', { name: /项目列表/ }));
  assert.ok(screen.getByRole('cell', { name: '维护中' }));
  await user.click(screen.getByRole('button', { name: '编辑', exact: true }));
  assert.equal(
    screen.getByLabelText('项目状态').value,
    migratedProjects.statuses[0].id,
  );
  assert.ok(screen.getByLabelText('项目分类'));
  assert.ok(screen.getByLabelText('摘要'));
  assert.equal(screen.queryByLabelText('编号'), null);
  assert.equal(screen.queryByLabelText('起点问题'), null);
  await user.type(screen.getByLabelText('项目说明 Markdown'), '## 新项目说明');
  await user.click(screen.getByRole('tab', { name: '项目分类' }));
  await user.click(screen.getByRole('button', { name: '＋ 新增项目分类' }));
  await user.type(screen.getByLabelText('项目分类 2'), '新分类');
  await user.click(screen.getByRole('tab', { name: /项目列表/ }));
  assert.equal(
    screen.getByLabelText('项目说明 Markdown').value,
    '## 新项目说明',
  );
  await user.selectOptions(
    screen.getByLabelText('项目分类'),
    screen.getByRole('option', { name: '新分类' }).value,
  );
  await user.click(screen.getByRole('button', { name: '← 返回项目表格' }));
  assert.ok(screen.getByRole('cell', { name: '新分类' }));
  cleanup();
  console.log(
    'PASS project table, taxonomy tabs/rename/deletion protection, simplified editor and Markdown draft retention',
  );
  function Models() {
    const [value, set] = useState('gpt-current');
    return h(AdminModelSelect, {
      id: 'model',
      label: '文本模型',
      value,
      models: ['gpt-current', 'another-model'],
      onChange: set,
    });
  }
  render(h(Models));
  await user.click(screen.getByRole('combobox', { name: '文本模型' }));
  assert.ok(await screen.findByRole('option', { name: 'another-model' }));
  assert.equal(screen.getByLabelText('搜索文本模型或输入自定义名称').value, '');
  await user.type(
    screen.getByLabelText('搜索文本模型或输入自定义名称'),
    'another',
  );
  await user.click(screen.getByRole('option', { name: 'another-model' }));
  assert.match(
    screen.getByRole('combobox', { name: '文本模型' }).textContent,
    /another-model/,
  );
  await user.click(screen.getByRole('combobox', { name: '文本模型' }));
  assert.ok(await screen.findByRole('option', { name: 'gpt-current' }));
  await user.type(
    screen.getByLabelText('搜索文本模型或输入自定义名称'),
    'custom-model',
  );
  await user.keyboard('{ArrowDown}{Enter}');
  await waitFor(() =>
    assert.match(
      screen.getByRole('combobox', { name: '文本模型' }).textContent,
      /custom-model/,
    ),
  );
  cleanup();
  console.log(
    'PASS model menu opens all options without clearing selection, search and keyboard custom selection',
  );

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ keyConfigured: true });
  function Settings() {
    const [value, set] = useState({
      baseUrl: 'https://example.com/v1',
      textModel: 'text',
      imageModel: 'image',
      projectImageStyle: '项目纸艺',
      projectImagePrompt: '{{title}} {{subtitle}} {{excerpt}}',
      coverStyle: '纸艺',
      coverPrompt: '{{title}} {{excerpt}}',
    });
    return h(AdminAiSettings, { value, onChange: set, dirty: false });
  }
  render(h(Settings));
  await user.click(screen.getByRole('tab', { name: '写作配置' }));
  await user.type(screen.getByLabelText('文章封面风格'), ' 新风格');
  await user.click(screen.getByRole('tab', { name: '模型配置' }));
  assert.ok(screen.getByLabelText('API Base URL'));
  await user.click(screen.getByRole('tab', { name: '写作配置' }));
  assert.equal(screen.getByLabelText('文章封面风格').value, '纸艺 新风格');
  cleanup();
  globalThis.fetch = originalFetch;
  console.log('PASS settings tabs retain unsaved writing configuration');

  function Categories() {
    const [value, set] = useState(categories);
    return h(AdminCategoryManager, {
      categories: value,
      articles: [article],
      onChange: set,
    });
  }
  render(h(Categories));
  assert.equal(screen.getByRole('button', { name: '删除分类' }).disabled, true);
  assert.equal(
    within(screen.getByLabelText('上级分类')).queryByRole('option', {
      name: /前端/,
    }),
    null,
  );
  await user.click(screen.getByRole('button', { name: /前端/ }));
  assert.equal(screen.getByLabelText('上级分类').value, 'root');
  await user.click(screen.getByRole('button', { name: '＋ 子分类' }));
  assert.equal(screen.getByLabelText('上级分类').value, 'child');
  await user.type(screen.getByLabelText('分类名称'), 'React');
  assert.ok(screen.getByRole('button', { name: /React/ }));
  cleanup();
  console.log(
    'PASS hierarchical category selection, child creation and deletion/parent restrictions',
  );

  function Writing() {
    const [value, set] = useState([
      article,
      {
        ...article,
        slug: 'second',
        title: '另一篇文章',
        _published: true,
        categoryId: 'root',
      },
    ]);
    return h(AdminWritingManager, {
      articles: value,
      categories,
      onChange: set,
      onWorking: () => {},
      busy: false,
    });
  }
  render(h(Writing));
  assert.equal(screen.getAllByRole('row').length, 3);
  await user.selectOptions(
    screen.getByLabelText('按发布状态筛选文章'),
    'draft',
  );
  assert.equal(screen.getAllByRole('row').length, 2);
  await user.click(screen.getByRole('button', { name: '编辑' }));
  assert.equal(
    window.getComputedStyle(window.document.querySelector('.admin-cover'))
      .borderTopWidth,
    '0px',
  );
  await user.type(screen.getByLabelText('文章标题'), ' 已编辑');
  await user.click(screen.getByLabelText('发布日期'));
  const calendar = await screen.findByRole('dialog');
  assert.equal(
    calendar.closest('.admin-article-edit'),
    null,
    'Calendar must be portalled outside the form flow',
  );
  assert.ok(
    ['absolute', 'fixed'].includes(
      window.getComputedStyle(calendar.closest('.admin-floating-positioner'))
        .position,
    ),
  );
  const day = within(calendar)
    .getAllByRole('button')
    .find((button) => button.textContent === '15');
  assert.ok(day);
  await user.click(day);
  await waitFor(() => assert.equal(screen.queryByRole('dialog'), null));
  assert.match(screen.getByLabelText('发布日期').textContent, /2026.09.15/);
  await user.click(screen.getByRole('button', { name: '← 返回文章表格' }));
  assert.ok(screen.getByRole('button', { name: '测试文章 已编辑' }));
  await user.click(screen.getByRole('button', { name: '发布' }));
  assert.equal(screen.getAllByRole('row').length, 1);
  cleanup();
  console.log(
    'PASS article table filtering, editing, portalled date selection, return and publication action',
  );
} finally {
  cleanup();
  await window.happyDOM.close();
}
