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
const { render, screen, cleanup, waitFor } =
  await import('@testing-library/react');
const { default: userEvent } = await import('@testing-library/user-event');

const { AdminActivityManager } =
  await import('../components/admin-activity-manager.tsx');
const { AdminBookManager } =
  await import('../components/admin-book-manager.tsx');
const { defaults } = await import('../lib/cms-defaults.ts');
const user = userEvent.setup({ document: window.document });
const realFetch = globalThis.fetch;
let release;
globalThis.fetch = () =>
  new Promise((resolve) => {
    release = resolve;
  });
function Harness({ section }) {
  const [busy, setBusy] = useState(false);
  const [value, setValue] = useState(structuredClone(defaults[section]));
  return h(
    'fieldset',
    { disabled: busy },
    h(section === 'books' ? AdminBookManager : AdminActivityManager, {
      section,
      value,
      onChange: setValue,
      onWorking: setBusy,
    }),
  );
}
try {
  for (const editing of [false, true])
    for (const failure of [false, true])
      for (const [section, trigger] of [
        ['travel', 'ai'],
        ['hobbies', 'ai'],
        ['books', 'ai'],
        ['travel', 'album'],
      ]) {
        render(h(Harness, { section }));
        const label = { travel: '旅行', hobbies: '爱好', books: '书籍' }[
          section
        ];
        await user.click(
          screen.getByRole('button', {
            name: editing ? defaults[section].items[0].title : `新增${label}`,
            exact: true,
          }),
        );
        const titleLabel = section === 'books' ? '书名' : `${label}标题`;
        await user.clear(screen.getByLabelText(titleLabel));
        await user.type(screen.getByLabelText(titleLabel), '保留这份草稿');
        if (section !== 'books')
          await user.type(screen.getByLabelText('简介'), '生成时必须仍然显示');
        if (trigger === 'ai')
          await user.click(screen.getByRole('button', { name: 'AI 生成封面' }));
        else
          await user.upload(
            screen.getByLabelText('上传相册图片'),
            new window.File(['image'], 'trip.png', { type: 'image/png' }),
          );
        assert.equal(typeof release, 'function');
        assert.equal(
          screen.queryByLabelText(titleLabel)?.value,
          '保留这份草稿',
          `${section}/${trigger}: fields disappeared while request pending`,
        );
        assert.ok(
          document.querySelector('[role="tabpanel"]') &&
            !document.querySelector('[role="tabpanel"]').hidden,
        );
        await user.click(screen.getByRole('tab', { name: `${label}分类` }));
        assert.equal(
          screen.getByLabelText(titleLabel).value,
          '保留这份草稿',
          'Tab switch must be blocked during request',
        );
        release(
          failure
            ? Response.json({ error: '模拟失败' }, { status: 502 })
            : Response.json({ url: '/api/media/generated.png' }),
        );
        await waitFor(() =>
          assert.equal(
            screen.getByRole('button', {
              name: editing ? '确认修改' : '确认添加',
            }).disabled,
            false,
          ),
        );
        assert.equal(screen.getByLabelText(titleLabel).value, '保留这份草稿');
        cleanup();
        release = undefined;
        console.log(
          `PASS ${section}/${trigger}/${editing ? 'edit' : 'new'}/${failure ? 'failure' : 'success'}: fields and draft retained`,
        );
      }
  for (const failure of [false, true]) for (const upload of [false, true]) {
    render(h(Harness, { section: 'books' }));
    await user.click(screen.getByRole('tab', { name: '主题书单' }));
    await user.click(screen.getByRole('button', { name: '新增主题书单' }));
    await user.type(screen.getByLabelText('书单名称'), '独立书单草稿');
    await user.type(screen.getByLabelText('书单简介'), '书单封面简介');
    await user.click(screen.getByRole('button', { name: '添加一行书籍' }));
    await user.type(screen.getByLabelText('书名 1'), '我的独立书目');
    if (upload) await user.upload(document.querySelector('input[type="file"]'), new window.File(['image'], 'list.png', { type: 'image/png' }));
    else await user.click(screen.getByRole('button', { name: 'AI 生成封面' }));
    assert.equal(typeof release, 'function');
    assert.equal(screen.getByLabelText('书名 1').value, '我的独立书目');
    release(failure ? Response.json({ error: '模拟失败' }, { status: 502 }) : Response.json({ url: '/api/media/booklist.png' }));
    await waitFor(() => assert.equal(screen.getByRole('button', { name: '确认书单' }).disabled, false));
    assert.equal(screen.getByLabelText('书单名称').value, '独立书单草稿');
    await user.click(screen.getByRole('button', { name: '确认书单' }));
    assert.ok(screen.getByText('独立书单草稿'));
    cleanup(); release = undefined;
    console.log(`PASS booklist/${upload ? 'upload' : 'ai'}/${failure ? 'failure' : 'success'}: visible editor and independent draft preserved`);
  }
} finally {
  globalThis.fetch = realFetch;
  cleanup();
  window.happyDOM.abort();
}
