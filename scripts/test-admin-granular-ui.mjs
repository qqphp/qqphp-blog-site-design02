import { Window } from 'happy-dom';
import { register } from 'node:module';
import assert from 'node:assert/strict';

register('./ui-test-loader.mjs', import.meta.url);
const window = new Window({ url: 'http://localhost:3000' });
for (const name of ['window', 'document', 'navigator', 'localStorage', 'HTMLElement',
  'HTMLInputElement', 'HTMLTextAreaElement', 'HTMLButtonElement', 'HTMLSelectElement',
  'Element', 'Node', 'NodeFilter', 'DocumentFragment', 'Event', 'MouseEvent',
  'KeyboardEvent', 'PointerEvent', 'FocusEvent', 'MutationObserver', 'ResizeObserver',
  'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame']) {
  const value = name === 'window' ? window : window[name];
  Object.defineProperty(globalThis, name, { value: typeof value === 'function' && !/^[A-Z]/.test(name)
    ? value.bind(window) : value, configurable: true });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
window.confirm = () => true;
const { createElement } = await import('react');
const { render, screen, waitFor, cleanup, within } = await import('@testing-library/react');
const { default: userEvent } = await import('@testing-library/user-event');
const { AdminGranularPanel } = await import('../components/admin-granular-panel.tsx');
const { defaults } = await import('../lib/cms-defaults.ts');
const user = userEvent.setup({ document: window.document });
const calls = [];
const category = { id: 'ui-category', name: '测试分类', description: '', parentId: '' };
let article = { ...defaults.writing[0], slug: 'ui-granular', title: '原文章', body: '正文',
  excerpt: '摘要', categoryId: category.id, category: category.name,
  cover: '/notes/paper-v2.png', coverMode: 'upload', coverGeneratedFor: '',
  _published: false };
let articleRevision = 1;
let home = { ...defaults.home };
let homeRevision = 1;
let failNextWrite = false;
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(typeof input === 'string' ? input : input.url, 'http://localhost:3000');
  calls.push({ path: url.pathname, method: init.method ?? 'GET', body: init.body ? JSON.parse(init.body) : null });
  if (url.pathname === '/api/admin/session')
    return Response.json({ authenticated: true, configured: true });
  if (url.pathname === '/api/admin/options/writing')
    return Response.json({ categories: [category] });
  if (url.pathname.startsWith('/api/admin/options/')) return Response.json({});
  if (url.pathname === '/api/admin/records/writing/articles') {
    if (init.method === 'POST') return Response.json({ revision: 1 });
    return Response.json({ items: [{ id: article.slug, title: article.title,
      excerpt: article.excerpt, revision: articleRevision, published: article._published,
      position: 0 }], total: 1, page: 1, size: 20 });
  }
  if (url.pathname === '/api/admin/records/writing/articles/ui-granular') {
    if (init.method === 'PUT') {
      if (failNextWrite) { failNextWrite = false; return Response.json({ error: '此记录已在另一窗口修改' }, { status: 409 }); }
      article = init.body ? JSON.parse(init.body).value : article;
      articleRevision++;
      return Response.json({ revision: articleRevision, value: article });
    }
    if (init.method === 'PATCH') {
      article = { ...article, _published: JSON.parse(init.body).published };
      articleRevision++;
      return Response.json({ revision: articleRevision, value: article });
    }
    return Response.json({ value: article, revision: articleRevision });
  }
  if (url.pathname === '/api/admin/config/home/root') {
    if (init.method === 'PUT') {
      home = JSON.parse(init.body).value;
      homeRevision++;
      return Response.json({ value: home, revision: homeRevision });
    }
    return Response.json({ value: home, revision: homeRevision });
  }
  return Response.json({ items: [], total: 0, page: 1, size: 20 });
};

try {
  render(createElement(AdminGranularPanel));
  await screen.findByRole('button', { name: '原文章' });
  assert.equal(calls.some((call) => call.path === '/api/admin/content'), false);
  for (const label of ['导出内容备份', '导入此栏目', '重新载入', '保存栏目'])
    assert.equal(screen.queryByText(label), null, label);
  assert.equal(window.document.querySelector('.admin-toolbar'), null);
  await user.click(screen.getByRole('button', { name: '原文章' }));
  await screen.findByLabelText('文章标题');
  await user.type(screen.getByLabelText('文章标题'), '已修改');
  assert.equal(calls.filter((call) => call.method === 'PUT').length, 0,
    '输入字段时不能自动保存');
  assert.ok(screen.getByRole('button', { name: '确认提交' }).closest('.admin-form-actions'));
  await user.click(screen.getByRole('button', { name: '确认提交' }));
  await waitFor(() => assert.equal(article.title, '原文章已修改'));
  const write = calls.find((call) => call.method === 'PUT' && call.path.includes('/records/'));
  assert.equal(Array.isArray(write.body.value), false);
  assert.equal(write.body.value.slug, 'ui-granular');
  assert.equal(Object.hasOwn(write.body, 'key'), false);
  await screen.findByRole('button', { name: '原文章已修改' });
  await user.click(screen.getByRole('button', { name: '发布' }));
  await waitFor(() => assert.equal(article._published, true));
  assert.ok(calls.some((call) => call.method === 'PATCH'));
  await user.click(screen.getByRole('button', { name: '＋ 新增文章管理' }));
  assert.equal(calls.some((call) => call.method === 'POST' && call.path.includes('/records/')), false);
  await user.click(screen.getByRole('button', { name: '← 返回列表' }));
  assert.equal(calls.some((call) => call.method === 'POST' && call.path.includes('/records/')), false);
  await user.click(within(screen.getByRole('navigation', { name: '后台栏目' })).getByRole('button', { name: '首页' }));
  await screen.findByLabelText('标题');
  await user.type(screen.getByLabelText('标题'), ' 测试');
  assert.equal(home.title, defaults.home.title);
  await user.click(screen.getByRole('button', { name: '确认提交' }));
  await waitFor(() => assert.ok(home.title.endsWith(' 测试')));
  await user.click(within(screen.getByRole('navigation', { name: '后台栏目' })).getByRole('button', { name: '写作' }));
  await screen.findByRole('button', { name: '原文章已修改' });
  await user.click(screen.getByRole('button', { name: '原文章已修改' }));
  await screen.findByLabelText('文章标题');
  await user.type(screen.getByLabelText('文章标题'), ' 未提交');
  failNextWrite = true;
  await user.click(screen.getByRole('button', { name: '确认提交' }));
  await screen.findByText(/此记录已在另一窗口修改/);
  assert.ok(screen.getByLabelText('文章标题').value.endsWith(' 未提交'),
    '冲突后必须保留表单内容');
  await user.click(within(screen.getByRole('navigation', { name: '后台栏目' })).getByRole('button', { name: '音乐' }));
  await user.click(screen.getByRole('tab', { name: '歌单' }));
  assert.ok(screen.getByRole('button', { name: '＋ 新增歌单' }));
  console.log('PASS per-record admin UI: no bulk fetch, explicit submit, immediate quick action, unsaved drafts and conflict retention');
} finally {
  cleanup();
  await window.happyDOM.abort();
}
