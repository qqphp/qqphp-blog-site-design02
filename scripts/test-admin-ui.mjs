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
      filmCoverStyle: '胶片',
      filmCoverPrompt: '{{title}} {{director}}',
      playlistCoverStyle: '唱片',
      playlistCoverPrompt: '{{title}} {{excerpt}}',
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
  await user.click(screen.getByRole('tab', { name: '电影配置' }));
  await user.type(screen.getByLabelText('电影封面风格'), ' 黑白');
  await user.click(screen.getByRole('tab', { name: '模型配置' }));
  await user.click(screen.getByRole('tab', { name: '电影配置' }));
  assert.equal(screen.getByLabelText('电影封面风格').value, '胶片 黑白');
  const settingTabs = screen
    .getAllByRole('tab')
    .map((node) => node.textContent);
  assert.equal(
    settingTabs.indexOf('音乐配置'),
    settingTabs.indexOf('项目配置') + 1,
  );
  await user.click(screen.getByRole('tab', { name: '音乐配置' }));
  await user.type(screen.getByLabelText('歌单封面风格'), ' 复古');
  await user.click(screen.getByRole('tab', { name: '电影配置' }));
  await user.click(screen.getByRole('tab', { name: '音乐配置' }));
  assert.equal(screen.getByLabelText('歌单封面风格').value, '唱片 复古');

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
  const { AdminDirectoryManager } =
    await import('../components/admin-directory-manager.tsx');
  const { migrateDirectory } = await import('../lib/directory-content.ts');
  const { validateContent } = await import('../lib/cms-validation.ts');
  for (const [section, label] of [
    ['bookmarks', '书签'],
    ['friends', '友链'],
  ]) {
    const legacy = [
      {
        name: '旧条目',
        category: '旧分类',
        url: 'https://example.com',
        description: '简介',
        _published: false,
      },
    ];
    const migrated = migrateDirectory(legacy);
    let latest = migrated;
    validateContent(section, migrated);
    assert.equal(migrated.items[0]._published, false);
    assert.deepEqual(migrateDirectory([]), { items: [], categories: [] });
    const onChange = (next) => {
      latest = next;
      view.rerender(
        h(AdminDirectoryManager, { section, value: latest, onChange }),
      );
    };
    const view = render(
      h(AdminDirectoryManager, { section, value: latest, onChange }),
    );
    assert.ok(screen.getByRole('table'));
    await user.type(screen.getByLabelText(`搜索${label}`), '不存在');
    assert.equal(screen.getAllByRole('row').length, 1);
    await user.clear(screen.getByLabelText(`搜索${label}`));
    await user.click(screen.getByRole('tab', { name: `${label}分类` }));
    assert.equal(
      screen.getByRole('button', { name: '删除旧分类' }).disabled,
      true,
    );
    await user.clear(screen.getByLabelText(`${label}分类 1`));
    await user.type(screen.getByLabelText(`${label}分类 1`), '新分类');
    assert.equal(latest.items[0].category, '新分类');
    await user.click(
      screen.getByRole('button', { name: `＋ 新增${label}分类` }),
    );
    await user.type(screen.getByLabelText(`${label}分类 2`), '第二分类');
    await user.click(
      screen.getByRole('tab', { name: new RegExp(`${label}列表`) }),
    );
    await user.selectOptions(
      screen.getByLabelText(`筛选${label}分类`),
      latest.categories[1].id,
    );
    assert.equal(screen.getAllByRole('row').length, 1);
    await user.click(screen.getByRole('button', { name: `＋ 新增${label}` }));
    await user.type(screen.getByLabelText(`${label}名称`), '新条目');
    await user.type(screen.getByLabelText('网站地址'), 'https://example.org');
    await user.selectOptions(
      screen.getByLabelText(`${label}分类`),
      latest.categories[1].id,
    );
    await user.click(
      screen.getByRole('button', { name: `← 返回${label}表格` }),
    );
    assert.ok(screen.getByRole('button', { name: '新条目' }));
    await user.click(screen.getByRole('button', { name: '发布' }));
    assert.equal(latest.items[1]._published, true);
    validateContent(section, latest);
    cleanup();
  }
  console.log(
    'PASS bookmark and friend tables, search, category filters, rename, protected deletion, creation and publication',
  );
  const { AiNotebook } = await import('../components/ai-notebook.tsx');
  const { aiSkills, aiRelays, aiPlans } =
    await import('../lib/ai-resources.ts');
  const aiView = render(
    h(ContentProvider, { content: defaults }, h(AiNotebook)),
  );
  const aiNames = ['AI资讯', 'Skills 工具箱', '中转站', 'Token Plan'];
  function activeRegion(name) {
    assert.equal(screen.getAllByRole('tabpanel').length, 1);
    assert.equal(
      screen
        .getByRole('tab', { name, exact: true })
        .getAttribute('aria-selected'),
      'true',
    );
    for (const other of aiNames.filter((item) => item !== name))
      assert.equal(
        screen.queryByRole('region', { name: other, exact: true }),
        null,
      );
    return screen.getByRole('region', { name, exact: true });
  }
  async function switchAi(name) {
    await user.click(screen.getByRole('tab', { name, exact: true }));
    return activeRegion(name);
  }
  const aiNotesRegion = activeRegion('AI资讯');
  assert.equal(
    within(aiNotesRegion).getAllByRole('article').length,
    defaults.aiNotes.length,
  );
  assert.equal(screen.queryByText('文字与思考'), null);
  const firstNote = within(aiNotesRegion).getAllByRole('article')[0];
  await user.click(within(firstNote).getByText('展开阅读'));
  assert.equal(firstNote.querySelector('details').open, true);
  await user.click(
    screen.getByRole('button', { name: '用法笔记', exact: true }),
  );
  assert.equal(
    within(aiNotesRegion).getAllByRole('article').length,
    defaults.aiNotes.filter((note) => note.kind === '用法笔记').length,
  );
  await user.type(screen.getByLabelText('搜索AI资讯'), '没有这条资讯');
  assert.equal(within(aiNotesRegion).queryAllByRole('article').length, 0);
  const skillRegion = await switchAi('Skills 工具箱');
  assert.equal(
    screen.getByLabelText('搜索Skills 工具箱').value,
    '',
    'Switching sections clears previous search',
  );
  assert.equal(
    within(skillRegion).getAllByRole('article').length,
    aiSkills.length,
  );
  await user.type(
    screen.getByLabelText('搜索Skills 工具箱'),
    'frontend-design',
  );
  assert.equal(within(skillRegion).getAllByRole('article').length, 1);
  const clipboardWrite = navigator.clipboard.writeText.bind(
    navigator.clipboard,
  );
  let copiedText = '';
  navigator.clipboard.writeText = async (text) => {
    copiedText = text;
  };
  const firstSkill = within(skillRegion).getAllByRole('article')[0];
  await user.click(within(firstSkill).getByText('怎么用'));
  await user.click(
    within(firstSkill).getByRole('button', {
      name: `复制 ${aiSkills[0].name} 指令`,
    }),
  );
  assert.equal(copiedText, aiSkills[0].prompt);
  const relayRegion = await switchAi('中转站');
  assert.equal(
    within(relayRegion).getAllByRole('article').length,
    aiRelays.length,
  );
  await user.type(screen.getByLabelText('搜索中转站'), 'OPENROUTER');
  assert.equal(within(relayRegion).getAllByRole('article').length, 1);
  assert.match(
    document.querySelector('.ai-search-result').textContent,
    /找到.*1.*条内容/,
  );
  const firstRelay = within(relayRegion).getAllByRole('article')[0];
  await user.click(within(firstRelay).getByText('API 地址'));
  await user.click(
    within(firstRelay).getByRole('button', {
      name: `复制 ${aiRelays[0].name} 地址`,
    }),
  );
  assert.equal(copiedText, aiRelays[0].endpoint);
  const planRegion = await switchAi('Token Plan');
  assert.equal(
    within(planRegion).getAllByRole('article').length,
    aiPlans.length,
  );
  await user.click(
    screen.getByRole('button', { name: 'API 按量', exact: true }),
  );
  assert.equal(within(planRegion).getAllByRole('article').length, 1);
  await user.type(screen.getByLabelText('搜索Token Plan'), '没有这条资料');
  assert.equal(within(planRegion).queryAllByRole('article').length, 0);
  await user.click(screen.getByRole('button', { name: '清空 AI 搜索' }));
  assert.equal(
    within(planRegion).getAllByRole('article').length,
    aiPlans.length,
  );
  // The hero shortcut must return to news even from another section.
  await user.click(screen.getByRole('link', { name: '浏览AI资讯' }));
  assert.equal(
    within(activeRegion('AI资讯')).getAllByRole('article').length,
    defaults.aiNotes.length,
  );
  await user.click(
    screen.getByRole('button', { name: '复制提示词', exact: true }),
  );
  assert.equal(copiedText, defaults.prompt.text);
  navigator.clipboard.writeText = async () => {
    throw new Error('Clipboard denied');
  };
  await user.click(
    screen.getByRole('button', { name: '复制提示词 · 已复制', exact: true }),
  );
  assert.ok(screen.getByText('复制失败，请展开内容手动复制。'));
  navigator.clipboard.writeText = clipboardWrite;
  await user.click(screen.getByRole('tab', { name: 'AI资讯', exact: true }));
  await user.keyboard('{ArrowRight}');
  assert.equal(
    document.activeElement,
    screen.getByRole('tab', { name: 'Skills 工具箱', exact: true }),
  );
  activeRegion('AI资讯');
  await user.keyboard('{Enter}');
  activeRegion('Skills 工具箱');
  await user.keyboard('{End}{Enter}');
  activeRegion('Token Plan');
  await user.keyboard('{Home}{Enter}');
  activeRegion('AI资讯');
  aiView.rerender(
    h(
      ContentProvider,
      { content: { ...defaults, aiNotes: [] } },
      h(AiNotebook),
    ),
  );
  assert.ok(screen.getByText('还没有公开资讯，新的发现会出现在这里。'));
  assert.equal(
    within(await switchAi('Skills 工具箱')).getAllByRole('article').length,
    aiSkills.length,
  );
  cleanup();
  console.log(
    'PASS AI news default, exclusive sections, keyboard tabs, per-section search, hero return, copy and empty content',
  );

  const { AdminFilmManager } =
    await import('../components/admin-film-manager.tsx');
  const { AdminPodcastManager } =
    await import('../components/admin-podcast-manager.tsx');
  const { PodcastLibrary } = await import('../components/podcast-library.tsx');
  const { podcastSample, podcastCoverInput, migratePodcasts } =
    await import('../lib/podcast-content.ts');
  const { validateContent: validatePodcast } =
    await import('../lib/cms-validation.ts');
  let podcasts = structuredClone(defaults.podcasts);
  const podcastFetch = globalThis.fetch;
  let podcastFail = false;
  const podcastRequests = [];
  globalThis.fetch = async (url, init) => {
    if (String(url).startsWith('/api/admin/media'))
      return Response.json({
        url: init.body.type.startsWith('audio/')
          ? '/api/media/clip.mp3'
          : '/api/media/podcast.png',
      });
    assert.equal(url, '/api/admin/ai');
    const body = JSON.parse(init.body);
    podcastRequests.push(body);
    return podcastFail
      ? Response.json({ error: '播客生成失败' }, { status: 502 })
      : Response.json({
          url: '/api/media/podcast-ai.png',
          generatedFor: podcastCoverInput({
            title: body.title,
            host: body.host,
            description: body.excerpt,
          }),
        });
  };
  let podcastAdmin;
  const changePodcasts = (next) => {
    podcasts = next;
    podcastAdmin.rerender(
      h(AdminPodcastManager, {
        value: podcasts,
        onChange: changePodcasts,
        onWorking: () => {},
      }),
    );
  };
  podcastAdmin = render(
    h(AdminPodcastManager, {
      value: podcasts,
      onChange: changePodcasts,
      onWorking: () => {},
    }),
  );
  assert.ok(screen.getByRole('table'));
  const countPodcasts = podcasts.items.length;
  await user.click(screen.getByRole('button', { name: /新增播客$/ }));
  await user.type(screen.getByLabelText('播客标题'), '新节目');
  await user.type(screen.getByLabelText('主播'), '测试主播');
  await user.type(screen.getByLabelText('简介'), '测试节目简介');
  assert.equal(podcasts.items.length, countPodcasts);
  assert.equal(screen.queryByLabelText('正文（Markdown）'), null);
  await user.upload(
    screen.getByLabelText('上传节选音频'),
    new window.File(['audio'], 'clip.mp3', { type: 'audio/mpeg' }),
  );
  await waitFor(() =>
    assert.ok(document.querySelector('audio[src="/api/media/clip.mp3"]')),
  );
  await user.upload(
    screen.getByLabelText('上传播客封面'),
    new window.File(['image'], 'cover.png', { type: 'image/png' }),
  );
  await waitFor(() => assert.ok(screen.getByAltText('播客封面预览')));
  assert.equal(
    screen.getByAltText('播客封面预览').getAttribute('width'),
    '300',
  );
  assert.equal(
    screen.getByAltText('播客封面预览').getAttribute('height'),
    '200',
  );
  await user.click(screen.getByLabelText('AI 生成'));
  podcastFail = true;
  await user.click(screen.getByRole('button', { name: '生成播客封面' }));
  await waitFor(() => assert.ok(screen.getByText(/播客生成失败/)));
  assert.equal(
    screen.getByAltText('播客封面预览').getAttribute('src'),
    '/api/media/podcast.png',
  );
  podcastFail = false;
  await user.click(screen.getByRole('button', { name: '生成播客封面' }));
  await waitFor(() =>
    assert.equal(
      screen.getByAltText('播客封面预览').getAttribute('src'),
      '/api/media/podcast-ai.png',
    ),
  );
  const podcastCallsBeforeConfirm = podcastRequests.length;
  await user.click(screen.getByRole('button', { name: '添加播客到列表' }));
  await waitFor(() => assert.equal(podcasts.items.length, countPodcasts + 1));
  assert.deepEqual(podcastRequests.at(-1), {
    action: 'podcast-cover',
    title: '新节目',
    host: '测试主播',
    excerpt: '测试节目简介',
  });
  assert.equal(podcasts.items.at(-1)._published, false);
  assert.equal(podcastRequests.length, podcastCallsBeforeConfirm);
  await user.click(screen.getByRole('button', { name: '新节目', exact: true }));
  await user.type(screen.getByLabelText('主播'), '修改');
  await user.click(screen.getByRole('button', { name: '确认修改' }));
  assert.equal(podcasts.items.at(-1).host, '测试主播修改');
  assert.equal(
    podcastRequests.length,
    podcastCallsBeforeConfirm,
    'Editing podcast metadata must not regenerate',
  );
  assert.equal(podcasts.items.at(-1).cover, '/api/media/podcast-ai.png');
  await user.click(screen.getByRole('button', { name: '新节目', exact: true }));
  await user.click(screen.getByRole('button', { name: '移除封面' }));
  await user.click(screen.getByRole('button', { name: '确认修改' }));
  assert.equal(podcasts.items.at(-1).cover, '');
  assert.equal(
    podcastRequests.length,
    podcastCallsBeforeConfirm,
    'Missing podcast cover must not trigger generation',
  );
  validatePodcast('podcasts', podcasts);
  await user.click(screen.getByRole('button', { name: '新节目', exact: true }));
  await user.type(screen.getByLabelText('播客标题'), '放弃修改');
  await user.click(screen.getByRole('button', { name: /返回播客列表/ }));
  assert.equal(podcasts.items.at(-1).title, '新节目');
  await user.click(screen.getByRole('tab', { name: /播客分类/ }));
  assert.ok(
    screen.getByRole('button', {
      name: `删除播客分类 ${podcasts.categories[0].name}`,
    }).disabled,
  );
  await user.clear(screen.getByLabelText('播客分类 1'));
  await user.type(screen.getByLabelText('播客分类 1'), '深度对谈');
  assert.equal(podcasts.categories[0].name, '深度对谈');
  const orphanPodcasts = structuredClone(podcasts);
  orphanPodcasts.categories = [];
  assert.throws(
    () => validatePodcast('podcasts', orphanPodcasts),
    /有效播客分类/,
  );
  const legacyPodcast = migratePodcasts({
    title: '播客',
    intro: '',
    entries: [
      {
        id: 'old',
        title: '旧节目',
        description: '旧简介',
        category: '话题',
        subtitle: '',
        body: ['旧稿'],
        _published: false,
      },
    ],
  });
  assert.equal(legacyPodcast.items[0].description, '旧简介');
  assert.equal(legacyPodcast.items[0]._published, false);
  assert.equal(legacyPodcast.categories[0].name, '话题');
  cleanup();
  globalThis.fetch = podcastFetch;
  const publicPodcasts = {
    ...podcasts,
    items: Array.from({ length: 14 }, (_, index) => ({
      ...podcastSample.items[0],
      id: `p-${index}`,
      title: `播客 ${index}`,
      host: '主播',
      description:
        index === 0
          ? '很长的节目简介，保留全部内容。\n'.repeat(200)
          : '节目简介',
      categoryId: podcasts.categories[0].id,
      audio: `/clip-${index}.mp3`,
    })),
  };
  render(
    h(
      ContentProvider,
      { content: { ...defaults, podcasts: publicPodcasts } },
      h(PodcastLibrary),
    ),
  );
  assert.equal(document.querySelectorAll('.podcast-card').length, 12);
  assert.equal(document.querySelector('.podcast-index'), null);
  assert.equal(
    document.querySelector('.podcast-card .podcast-description'),
    null,
  );
  const descriptionTrigger = screen.getByRole('button', {
    name: '查看播客 0简介',
  });
  await user.click(descriptionTrigger);
  let descriptionDialog = await screen.findByRole('dialog');
  assert.ok(within(descriptionDialog).getByRole('heading', { name: '播客 0' }));
  assert.equal(
    descriptionDialog.querySelector('.podcast-description').textContent,
    publicPodcasts.items[0].description,
  );
  await user.keyboard('{Escape}');
  await waitFor(() => assert.equal(screen.queryByRole('dialog'), null));
  await waitFor(() => assert.equal(document.activeElement, descriptionTrigger));
  await user.click(descriptionTrigger);
  descriptionDialog = await screen.findByRole('dialog');
  await user.click(
    within(descriptionDialog).getByRole('button', { name: '关闭简介' }),
  );
  await waitFor(() => assert.equal(screen.queryByRole('dialog'), null));
  const excerptAudios = document.querySelectorAll('audio');
  let pausedOthers = 0;
  excerptAudios.forEach((audio) => {
    audio.pause = () => {
      pausedOthers++;
    };
  });
  fireEvent.play(excerptAudios[0]);
  assert.equal(pausedOthers, 11);
  fireEvent.error(excerptAudios[0]);
  assert.ok(screen.getByText('音频暂时无法播放，请稍后重试。'));
  await user.click(screen.getByRole('button', { name: '下一页' }));
  assert.ok(screen.getByRole('heading', { name: '播客 12' }));
  await user.type(screen.getByLabelText('搜索播客'), '播客 13');
  assert.equal(document.querySelectorAll('.podcast-card').length, 1);
  await user.click(
    screen.getByRole('button', { name: podcasts.categories[1].name }),
  );
  assert.ok(screen.getByText('没有找到匹配的节目。'));
  await user.click(screen.getByRole('button', { name: '清空筛选' }));
  assert.equal(document.querySelectorAll('.podcast-card').length, 12);
  cleanup();
  console.log(
    'PASS podcast table, staged edit/discard, category rename/protection, single audio upload, 3:2 upload/AI/failure, migration, search/pagination and exclusive excerpt playback/error',
  );
  const { FilmLibrary } = await import('../components/film-library.tsx');
  const { filmSample, migrateFilms, filmCoverInput } =
    await import('../lib/film-content.ts');
  const { validateContent: validateFilm } =
    await import('../lib/cms-validation.ts');
  let films = structuredClone(defaults.films);
  const filmRequests = [];
  const savedFetch = globalThis.fetch;
  let filmFailure = false;
  globalThis.fetch = async (url, init) => {
    if (url === '/api/admin/media')
      return Response.json({ url: '/api/media/uploaded-film.png' });
    if (url === '/api/admin/ai') {
      const body = JSON.parse(init.body);
      filmRequests.push(body);
      return filmFailure
        ? Response.json({ error: '电影封面模拟失败' }, { status: 502 })
        : Response.json({
            url: '/api/media/film-cover.png',
            generatedFor: filmCoverInput({
              title: body.title,
              director: body.director,
              description: body.excerpt,
            }),
          });
    }
    throw Error('Unexpected film test request');
  };
  const changeFilms = (next) => {
    films = next;
    filmAdmin.rerender(
      h(AdminFilmManager, {
        value: films,
        onChange: changeFilms,
        onWorking: () => {},
      }),
    );
  };
  const filmAdmin = render(
    h(AdminFilmManager, {
      value: films,
      onChange: changeFilms,
      onWorking: () => {},
    }),
  );
  assert.equal(screen.getAllByRole('row').length, films.items.length + 1);
  await user.click(screen.getByRole('button', { name: '＋ 新增电影' }));
  assert.equal(screen.getByLabelText('电影标题').value, '');
  assert.equal(screen.queryByLabelText('简介'), null);
  assert.equal(
    window.getComputedStyle(
      document.querySelector('.admin-film-editor .admin-music-actions'),
    ).marginTop,
    '28px',
  );
  await user.click(screen.getByRole('button', { name: '← 返回电影列表' }));
  assert.equal(films.items.length, defaults.films.items.length);
  await user.click(screen.getByRole('button', { name: '＋ 新增电影' }));
  for (const [label, text] of [
    ['电影标题', '测试电影'],
    ['导演', '测试导演'],
    ['类型', '剧情'],
    ['国家', '中国'],
    ['语言', '汉语'],
  ])
    await user.type(screen.getByLabelText(label), text);
  await user.upload(
    screen.getByLabelText('上传电影封面'),
    new window.File(['image'], 'poster.png', { type: 'image/png' }),
  );
  await waitFor(() =>
    assert.ok(
      screen
        .getByAltText('电影封面预览')
        .src.endsWith('/api/media/uploaded-film.png'),
    ),
  );
  assert.equal(
    window.getComputedStyle(
      screen
        .getByRole('button', { name: '移除封面' })
        .closest('.admin-film-cover-actions'),
    ).gap,
    '12px',
  );
  await user.click(screen.getByRole('radio', { name: 'AI 生成' }));
  filmFailure = true;
  await user.click(screen.getByRole('button', { name: '生成电影封面' }));
  await screen.findByText(/电影封面模拟失败/);
  assert.ok(
    screen
      .getByAltText('电影封面预览')
      .src.endsWith('/api/media/uploaded-film.png'),
  );
  filmFailure = false;
  await user.click(screen.getByRole('button', { name: '生成电影封面' }));
  await waitFor(() =>
    assert.ok(
      screen
        .getByAltText('电影封面预览')
        .src.endsWith('/api/media/film-cover.png'),
    ),
  );
  const filmCallsBeforeConfirm = filmRequests.length;
  await user.click(screen.getByRole('button', { name: '添加电影到列表' }));
  await waitFor(() =>
    assert.equal(films.items.at(-1).cover, '/api/media/film-cover.png'),
  );
  assert.deepEqual(filmRequests.at(-1), {
    action: 'film-cover',
    title: '测试电影',
    director: '测试导演',
  });
  assert.equal(films.items.at(-1)._published, false);
  assert.equal(filmRequests.length, filmCallsBeforeConfirm);
  await user.click(screen.getByRole('tab', { name: /电影分类/ }));
  assert.equal(
    screen.getByRole('button', { name: '删除电影分类 推荐榜' }).disabled,
    true,
  );
  fireEvent.change(screen.getByLabelText('电影分类 1'), {
    target: { value: '值得重看' },
  });
  await user.click(screen.getByRole('button', { name: '＋ 新增电影分类' }));
  fireEvent.change(
    screen.getByRole('textbox', {
      name: `电影分类 ${films.categories.length}`,
      exact: true,
    }),
    { target: { value: '待看' } },
  );
  await user.click(screen.getByRole('button', { name: '删除电影分类 待看' }));
  assert.ok(!films.categories.some((item) => item.name === '待看'));
  await user.click(screen.getByRole('tab', { name: /电影管理/ }));
  await user.selectOptions(
    screen.getByLabelText('筛选电影分类'),
    films.categories[0].id,
  );
  assert.equal(screen.getAllByRole('row').length, 2);
  await user.type(screen.getByLabelText('搜索电影'), '不存在');
  assert.equal(screen.getAllByRole('row').length, 1);
  await user.clear(screen.getByLabelText('搜索电影'));
  await user.click(
    screen.getByRole('button', { name: '测试电影', exact: true }),
  );
  await user.type(screen.getByLabelText('导演'), '修改');
  await user.click(screen.getByRole('button', { name: '确认修改' }));
  await waitFor(() =>
    assert.equal(films.items.at(-1).director, '测试导演修改'),
  );
  assert.equal(
    filmRequests.length,
    filmCallsBeforeConfirm,
    'Editing film metadata must not regenerate',
  );
  assert.equal(films.items.at(-1).cover, '/api/media/film-cover.png');
  await user.click(
    screen.getByRole('button', { name: '测试电影', exact: true }),
  );
  await user.click(screen.getByRole('button', { name: '移除封面' }));
  await user.click(screen.getByRole('button', { name: '确认修改' }));
  assert.equal(films.items.at(-1).cover, '');
  assert.equal(
    filmRequests.length,
    filmCallsBeforeConfirm,
    'Missing film cover must not trigger generation',
  );
  validateFilm('films', films);
  const legacyFilm = migrateFilms({
    title: '电影',
    intro: '旧简介',
    entries: [
      {
        id: 'legacy',
        title: '旧电影',
        subtitle: '旧副标题',
        category: '剧情',
        description: '原简介',
        body: ['原正文'],
        _published: false,
      },
    ],
  });
  assert.equal('description' in legacyFilm.items[0], false);
  assert.equal(legacyFilm.items[0]._published, false);
  cleanup();
  globalThis.fetch = savedFetch;
  const manyFilms = {
    ...films,
    items: Array.from({ length: 25 }, (_, i) => ({
      ...films.items.at(-1),
      id: `film-${i}`,
      cover: '/api/media/film-cover.png',
      title: `影片 ${i}`,
      description: '测试简介',
      _published: true,
    })),
  };
  render(
    h(AdminFilmManager, {
      value: manyFilms,
      onChange: () => {},
      onWorking: () => {},
    }),
  );
  assert.equal(screen.getAllByRole('row').length, 21);
  await user.click(screen.getByRole('button', { name: '下一页' }));
  assert.ok(screen.getByRole('button', { name: '影片 20', exact: true }));
  cleanup();

  const filmFront = render(
    h(
      ContentProvider,
      { content: { ...defaults, films: manyFilms } },
      h(FilmLibrary),
    ),
  );
  assert.equal(document.querySelectorAll('.cinema-program-image').length, 20);
  assert.ok(screen.getByRole('button', { name: /值得重看/ }));
  assert.ok(screen.getByRole('heading', { name: '影片 0' }));
  const filmCard = screen
    .getByRole('heading', { name: '影片 0' })
    .closest('li');
  assert.ok(
    filmCard.querySelector('.cinema-program-image + .cinema-card-info'),
  );
  assert.equal(filmCard.querySelector('img').getAttribute('width'), '180');
  assert.equal(filmCard.querySelector('img').getAttribute('height'), '320');

  assert.equal(screen.queryByText('展开完整简介'), null);
  assert.ok(screen.getAllByText('测试导演修改').length);
  assert.ok(screen.getAllByText('剧情').length);
  assert.ok(screen.getAllByText('中国').length);
  assert.ok(screen.getAllByText('汉语').length);
  await user.click(screen.getByRole('button', { name: '下一页' }));
  assert.ok(screen.getByRole('heading', { name: '影片 20' }));
  await user.type(screen.getByLabelText('搜索电影'), '影片 24');
  assert.equal(document.querySelectorAll('.cinema-program-image').length, 1);
  await user.click(screen.getByRole('button', { name: /劝退榜/ }));
  assert.ok(screen.getByText('这一场，暂时没有影片。'));
  await user.click(screen.getByRole('button', { name: '清空筛选' }));
  filmFront.rerender(
    h(
      ContentProvider,
      { content: { ...defaults, films: { ...films, items: [] } } },
      h(FilmLibrary),
    ),
  );
  assert.ok(screen.getByText('电影档案等待第一部影片。'));
  cleanup();
  console.log(
    'PASS film table, manual fields, staged editing, image upload/AI/failure, managed categories, legacy migration and public archive search/pagination/empty states',
  );

  const { AdminMusicManager } =
    await import('../components/admin-music-manager.tsx');
  const { MusicLibrary } = await import('../components/music-library.tsx');
  const { MusicProvider } = await import('../components/music-player.tsx');
  const { musicSample, migrateMusic, publicMusic } =
    await import('../lib/music-content.ts');
  const { validateContent: validateMusicContent } =
    await import('../lib/cms-validation.ts');
  let musicDraft = structuredClone(defaults.tracks);
  assert.deepEqual(migrateMusic(defaults.tracks.items), defaults.tracks);
  const onMusicChange = (next) => {
    musicDraft = next;
    musicAdmin.rerender(
      h(AdminMusicManager, { value: musicDraft, onChange: onMusicChange }),
    );
  };
  const musicAdmin = render(
    h(AdminMusicManager, { value: musicDraft, onChange: onMusicChange }),
  );
  assert.equal(screen.getAllByRole('row').length, musicDraft.items.length + 1);

  const originalCount = musicDraft.items.length;
  await user.click(screen.getByRole('button', { name: '＋ 新增音乐' }));
  assert.equal(screen.getByLabelText('音乐名称').value, '');
  assert.equal(screen.queryByRole('spinbutton'), null);
  assert.equal(screen.queryByLabelText('音乐介绍'), null);
  await user.type(screen.getByLabelText('音乐名称'), '放弃新增');
  await user.click(screen.getByRole('button', { name: '← 返回音乐列表' }));
  assert.equal(musicDraft.items.length, originalCount);
  await user.click(screen.getByRole('button', { name: '＋ 新增音乐' }));
  await user.type(screen.getByLabelText('音乐名称'), '新增测试音乐');
  await user.type(screen.getByLabelText('音频地址'), '/audio/test.wav');
  const confirmMusic = () =>
    screen.getByRole('button', { name: '添加音乐到列表' });
  assert.equal(confirmMusic().disabled, true);
  const metadata = (seconds) => {
    const audio = screen.getByLabelText('音频时长检测');
    Object.defineProperty(audio, 'duration', {
      value: seconds,
      configurable: true,
    });
    fireEvent.loadedMetadata(audio);
    return audio;
  };
  metadata(Infinity);
  assert.equal(confirmMusic().disabled, true);
  metadata(123.75);
  assert.ok(screen.getByText('2:03'));
  assert.equal(confirmMusic().disabled, false);
  assert.ok(
    screen
      .getByLabelText('音频地址')
      .closest('.admin-music-audio-row')
      .contains(screen.getByLabelText('音频时长检测')),
  );
  assert.equal(
    window.getComputedStyle(document.querySelector('.admin-music-actions'))
      .marginTop,
    '28px',
  );
  const assetOutput = screen
    .getByLabelText('音频地址')
    .closest('.admin-field')
    .querySelector('.admin-asset output');
  assert.equal(assetOutput.textContent, '');
  assert.notEqual(window.getComputedStyle(assetOutput).minHeight, '48px');
  assert.notEqual(window.getComputedStyle(assetOutput).paddingTop, '12px');
  const durationOutput = document.querySelector(
    '.admin-music-audio-row > .admin-field:last-child > output',
  );
  assert.equal(window.getComputedStyle(durationOutput).minHeight, '48px');
  const oldProbe = screen.getByLabelText('音频时长检测');
  fireEvent.change(screen.getByLabelText('音频地址'), {
    target: { value: '/audio/new.wav' },
  });
  assert.equal(confirmMusic().disabled, true);
  fireEvent.loadedMetadata(oldProbe);
  assert.equal(confirmMusic().disabled, true);
  fireEvent.error(screen.getByLabelText('音频时长检测'));
  assert.ok(screen.getByText(/音频读取失败/));
  assert.equal(confirmMusic().disabled, true);
  metadata(91.5);
  await user.click(confirmMusic());
  assert.equal(musicDraft.items.length, originalCount + 1);
  assert.equal(musicDraft.items.at(-1).duration, 91.5);
  assert.equal(musicDraft.items.at(-1)._published, false);
  await user.click(
    screen.getByRole('button', { name: '新增测试音乐', exact: true }),
  );
  assert.equal(screen.getByRole('button', { name: '确认修改' }).disabled, true);
  metadata(92);
  await user.click(screen.getByRole('button', { name: '确认修改' }));
  assert.equal(musicDraft.items.at(-1).duration, 92);
  await user.click(screen.getByRole('tab', { name: /场景管理/ }));
  assert.equal(
    screen.getByRole('button', {
      name: `删除场景 ${musicDraft.scenes[0].name}`,
    }).disabled,
    true,
  );
  fireEvent.change(screen.getByLabelText('场景 1'), {
    target: { value: '专注写作' },
  });
  assert.equal(musicDraft.items[0].mood, '专注写作');
  await user.click(screen.getByRole('button', { name: '＋ 新增场景' }));
  fireEvent.change(screen.getByLabelText(`场景 ${musicDraft.scenes.length}`), {
    target: { value: '睡前' },
  });
  const newSceneId = musicDraft.scenes.at(-1).id;
  await user.click(screen.getByRole('tab', { name: /音乐管理/ }));
  await user.click(
    screen.getByRole('button', { name: '新增测试音乐', exact: true }),
  );
  await user.selectOptions(screen.getByLabelText('场景'), newSceneId);
  metadata(92);
  await user.click(screen.getByRole('button', { name: '确认修改' }));
  assert.equal(musicDraft.items.at(-1).mood, '睡前');
  await user.click(screen.getByRole('tab', { name: /歌单管理/ }));
  await user.click(screen.getByRole('button', { name: '＋ 新增歌单' }));
  assert.equal(screen.getByLabelText('歌单名称').value, '');
  await user.click(screen.getByRole('button', { name: '← 返回歌单列表' }));
  assert.equal(musicDraft.playlists.length, 0);
  await user.click(screen.getByRole('button', { name: '＋ 新增歌单' }));
  await user.type(screen.getByLabelText('歌单名称'), '夜间选集');
  for (const [i, title] of ['独立曲目甲', '独立曲目乙'].entries()) {
    await user.click(screen.getByRole('button', { name: '＋ 添加歌曲' }));
    assert.equal(
      screen.getByRole('button', { name: '添加歌单到列表' }).disabled,
      true,
    );
    await user.type(screen.getByLabelText(`歌曲名称 ${i + 1}`), title);
    await user.type(screen.getByLabelText(`歌手 ${i + 1}`), `作者${i + 1}`);
  }
  await user.click(screen.getByRole('checkbox', { name: /发布到前台/ }));
  await user.click(screen.getByRole('button', { name: '添加歌单到列表' }));
  assert.deepEqual(musicDraft.playlists[0].songs, [
    { title: '独立曲目甲', artist: '作者1' },
    { title: '独立曲目乙', artist: '作者2' },
  ]);
  await user.click(
    screen.getByRole('button', { name: '夜间选集', exact: true }),
  );
  await user.click(screen.getByRole('button', { name: '上移歌曲 2' }));
  assert.equal(screen.getByLabelText('歌曲名称 1').value, '独立曲目乙');
  await user.click(screen.getByRole('button', { name: '移除歌曲 1' }));
  await user.click(screen.getByRole('button', { name: '确认修改' }));
  assert.equal(musicDraft.playlists[0].songs.length, 1);
  validateMusicContent('tracks', musicDraft);
  const legacy = {
    items: defaults.tracks.items,
    playlists: [
      {
        ...musicSample.playlists[0],
        songs: undefined,
        trackIds: [defaults.tracks.items[0].id],
      },
    ],
  };
  assert.deepEqual(migrateMusic(legacy).playlists[0].songs, [
    {
      title: defaults.tracks.items[0].title,
      artist: defaults.tracks.items[0].artist,
    },
  ]);
  const independent = structuredClone(musicDraft);
  independent.items = [];
  assert.deepEqual(
    publicMusic(independent).playlists[0].songs,
    musicDraft.playlists[0].songs,
  );
  cleanup();

  let playlistDocument = structuredClone(musicDraft);
  const playlistFetch = globalThis.fetch;
  const playlistCalls = [];
  let failPlaylist = false;
  globalThis.fetch = async (url, init) => {
    if (url === '/api/admin/media')
      return Response.json({ url: '/api/media/playlist-upload.png' });
    if (url === '/api/admin/ai') {
      const body = JSON.parse(init.body);
      playlistCalls.push(body);
      return failPlaylist
        ? Response.json({ error: '歌单生成模拟失败' }, { status: 502 })
        : Response.json({
            url: '/api/media/playlist-ai.png',
            generatedFor: JSON.stringify([body.title, body.excerpt, '1:1']),
          });
    }
    throw Error('Unexpected playlist request');
  };
  const updatePlaylistDocument = (next) => {
    playlistDocument = next;
    playlistManager.rerender(
      h(AdminMusicManager, {
        value: playlistDocument,
        onChange: updatePlaylistDocument,
      }),
    );
  };
  const playlistManager = render(
    h(AdminMusicManager, {
      value: playlistDocument,
      onChange: updatePlaylistDocument,
    }),
  );
  await user.click(screen.getByRole('tab', { name: /歌单管理/ }));
  await user.click(
    screen.getByRole('button', { name: '夜间选集', exact: true }),
  );
  await user.type(screen.getByLabelText('歌单简介'), '安静的夜间音乐');
  await user.upload(
    screen.getByLabelText('上传歌单封面'),
    new window.File(['image'], 'playlist.png', { type: 'image/png' }),
  );
  await waitFor(() =>
    assert.ok(
      screen
        .getByAltText('歌单封面预览')
        .src.endsWith('/api/media/playlist-upload.png'),
    ),
  );
  await user.click(screen.getByRole('radio', { name: 'AI 生成' }));
  failPlaylist = true;
  await user.click(screen.getByRole('button', { name: '生成歌单封面' }));
  await screen.findByText(/歌单生成模拟失败/);
  assert.ok(
    screen
      .getByAltText('歌单封面预览')
      .src.endsWith('/api/media/playlist-upload.png'),
  );
  failPlaylist = false;
  await user.click(screen.getByRole('button', { name: '确认修改' }));
  await waitFor(() =>
    assert.equal(
      playlistDocument.playlists[0].cover,
      '/api/media/playlist-ai.png',
    ),
  );
  assert.deepEqual(playlistCalls.at(-1), {
    action: 'playlist-cover',
    title: '夜间选集',
    excerpt: '安静的夜间音乐',
  });
  validateMusicContent('tracks', playlistDocument);
  await user.click(screen.getByRole('button', { name: '＋ 新增歌单' }));
  await user.type(screen.getByLabelText('歌单名称'), '全新 AI 歌单');
  await user.type(screen.getByLabelText('歌单简介'), '雨天听的歌');
  await user.click(screen.getByRole('radio', { name: 'AI 生成' }));
  assert.equal(
    window.getComputedStyle(document.querySelector('.admin-music-actions'))
      .marginTop,
    '28px',
  );
  await user.click(screen.getByRole('button', { name: '添加歌单到列表' }));
  await waitFor(() =>
    assert.equal(playlistDocument.playlists.at(-1).title, '全新 AI 歌单'),
  );
  assert.equal(
    playlistDocument.playlists.at(-1).cover,
    '/api/media/playlist-ai.png',
  );
  assert.equal(playlistCalls.at(-1).excerpt, '雨天听的歌');
  const oldMusic = migrateMusic([
    { ...defaults.tracks.items[0], note: 'OBSOLETE_MUSIC_NOTE' },
  ]);
  assert.equal(JSON.stringify(oldMusic).includes('OBSOLETE_MUSIC_NOTE'), false);

  cleanup();
  globalThis.fetch = playlistFetch;
  const manyMusic = {
    scenes: defaults.tracks.scenes,
    items: Array.from({ length: 61 }, (_, index) => ({
      ...defaults.tracks.items[index % 3],
      id: `track-${index}`,
      title: `音乐 ${index}`,
    })),
    playlists: Array.from({ length: 25 }, (_, index) => ({
      ...musicSample.playlists[0],
      id: `mix-${index}`,
      title: `歌单 ${index}`,
      songs: [
        { title: '独立歌曲 2', artist: '作者 2' },
        { title: '独立歌曲 0', artist: '作者 0' },
      ],
      _published: true,
    })),
  };
  render(h(AdminMusicManager, { value: manyMusic, onChange: () => {} }));
  assert.equal(screen.getAllByRole('row').length, 21);
  await user.click(screen.getByRole('button', { name: '下一页', exact: true }));
  assert.ok(screen.getByRole('button', { name: '音乐 20', exact: true }));
  cleanup();
  const privacyFixture = structuredClone(manyMusic);
  privacyFixture.items[2]._published = false;
  privacyFixture.playlists[1]._published = false;
  const publicFixture = publicMusic(privacyFixture);
  assert.ok(!publicFixture.items.some((item) => item.id === 'track-2'));
  assert.deepEqual(
    publicFixture.playlists[0].songs,
    manyMusic.playlists[0].songs,
  );
  assert.ok(!publicFixture.playlists.some((item) => item.id === 'mix-1'));
  console.log(
    'PASS staged music and playlists, automatic duration/error/stale metadata, managed scenes, independent songs, legacy migration and public filtering',
  );
  const audioProto = window.HTMLMediaElement.prototype;
  const audioMethods = Object.getOwnPropertyDescriptors(audioProto);
  audioProto.play = async function () {
    Object.defineProperty(this, 'paused', { value: false, configurable: true });
    this.dispatchEvent(new window.Event('play'));
  };
  audioProto.pause = function () {
    Object.defineProperty(this, 'paused', { value: true, configurable: true });
    this.dispatchEvent(new window.Event('pause'));
  };
  audioProto.load = function () {};
  const musicFrontend = (value) =>
    h(
      ContentProvider,
      { content: { ...defaults, tracks: value } },
      h(MusicProvider, {}, h(MusicLibrary)),
    );
  const musicFront = render(musicFrontend(manyMusic));
  assert.equal(
    document.querySelector('audio').getAttribute('src'),
    null,
    'Do not preload or auto-play audio',
  );
  await user.click(screen.getByRole('button', { name: '播放台播放' }));
  assert.ok(
    document.querySelector('audio').src.endsWith(manyMusic.items[0].src),
  );
  await user.click(screen.getByRole('button', { name: '播放台暂停' }));
  assert.equal(document.querySelectorAll('.music-track-row').length, 25);
  await user.click(screen.getByRole('button', { name: '下一页', exact: true }));
  assert.ok(screen.getByRole('button', { name: '音乐 25', exact: true }));
  await user.type(screen.getByLabelText('搜索我的音乐'), '音乐 60');
  assert.equal(document.querySelectorAll('.music-track-row').length, 1);
  await user.click(screen.getByRole('tab', { name: /我的歌单/ }));
  assert.equal(document.querySelectorAll('.music-playlist-card').length, 12);
  await user.click(screen.getByRole('button', { name: '下一页', exact: true }));
  assert.ok(
    screen.getByRole('button', { name: '打开歌单 歌单 12', exact: true }),
  );
  await user.type(screen.getByLabelText('搜索我的歌单'), '歌单 0');
  await user.click(
    screen.getByRole('button', { name: '打开歌单 歌单 0', exact: true }),
  );
  const songTable = screen.getByRole('table', { name: '歌单曲目列表' });
  assert.deepEqual(
    within(songTable)
      .getAllByRole('columnheader')
      .map((node) => node.textContent),
    ['序号', '曲目', '作者'],
  );
  assert.deepEqual(
    [...songTable.querySelectorAll('tbody tr')].map((row) => row.textContent),
    ['01独立歌曲 2作者 2', '02独立歌曲 0作者 0'],
  );
  assert.equal(within(songTable).queryByRole('button'), null);
  assert.equal(
    screen.queryByRole('button', { name: /播放当前列表|播放歌单/ }),
    null,
  );
  assert.equal(screen.queryByLabelText('音乐场景筛选'), null);
  await user.type(screen.getByLabelText('搜索歌单曲目'), '独立歌曲 0');
  assert.equal(songTable.querySelectorAll('tbody tr').length, 1);
  assert.ok(songTable.textContent.includes('02'));
  await user.click(screen.getByRole('tab', { name: /我的音乐/ }));
  assert.equal(screen.queryByText('音乐介绍'), null);
  assert.equal(screen.queryByText('听歌笔记'), null);
  await user.selectOptions(
    screen.getByLabelText('音乐场景筛选'),
    manyMusic.scenes[0].name,
  );
  await user.click(screen.getByRole('button', { name: /播放当前列表/ }));
  const element = document.querySelector('audio');
  assert.ok(element.src.endsWith(manyMusic.items[0].src));
  await user.click(screen.getByRole('button', { name: '下一首', exact: true }));
  assert.ok(screen.getByRole('button', { name: '暂停 音乐 3', exact: true }));
  fireEvent.ended(element);
  await waitFor(() =>
    assert.ok(screen.getByRole('button', { name: '暂停 音乐 6', exact: true })),
  );
  await user.click(screen.getByRole('button', { name: '上一首', exact: true }));
  assert.ok(screen.getByRole('button', { name: '暂停 音乐 3', exact: true }));
  await user.click(screen.getByRole('button', { name: '播放台暂停' }));
  fireEvent.error(element);
  assert.ok(screen.getByRole('alert'));
  await user.selectOptions(screen.getByLabelText('音乐场景筛选'), '');
  musicFront.rerender(musicFrontend({ items: [], playlists: [], scenes: [] }));
  assert.ok(screen.getByText('音乐库还在等待第一首歌'));
  assert.equal(document.querySelector('audio'), null);
  await user.click(screen.getByRole('tab', { name: /我的歌单/ }));
  assert.ok(screen.getByText('留一个位置，给下一张歌单。'));
  cleanup();
  for (const method of ['play', 'pause', 'load'])
    Object.defineProperty(audioProto, method, audioMethods[method]);
  console.log(
    'PASS music library pagination/search, playlist details, queue ordering/looping, persistent playback, pause/error and empty states',
  );
} finally {
  cleanup();
  await window.happyDOM.close();
}
