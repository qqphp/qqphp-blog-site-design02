import assert from 'node:assert/strict';
import { defaults } from '../lib/cms-defaults.ts';
import { migratePageCopy } from '../lib/page-copy.ts';
import { validateContent } from '../lib/cms-validation.ts';

const removed = {
  说说页: ['04', '07', '09', '10'],
  项目页: ['17', '18', '20', '16', '15', '19', '11', '09'],
};
const legacy = structuredClone(defaults.copy);
legacy['说说封面'] = { '01 / AI 生成': '旧封面标记' };
delete legacy.说说页['08 发布名称'];
legacy.说说页['08 开发阿雷'] = '自定义发布者';
legacy.说说页['03 条说说 ·'] = '条说说 ·';
legacy.项目页['07 不只陈列结果，'] = '保留项目介绍';
for (const [page, prefixes] of Object.entries(removed))
  for (const prefix of prefixes) legacy[page][`${prefix} 旧字段`] = '旧值';
const original = structuredClone(legacy);
const migrated = migratePageCopy(legacy);
assert.deepEqual(legacy, original);
assert.equal('说说封面' in migrated, false);
assert.throws(() => validateContent('copy', { ...migrated, 说说封面: legacy['说说封面'] }), /不支持的字段/);
assert.equal(migrated.说说页['08 发布名称'], '自定义发布者');
assert.equal(migrated.说说页['03 条说说 ·'], '条说说');
assert.equal(migrated.项目页['07 不只陈列结果，'], '保留项目介绍');
assert.equal('08 开发阿雷' in migrated.说说页, false);
assert.deepEqual(migratePageCopy(migrated), migrated);
validateContent('copy', migrated);
for (const [page, prefixes] of Object.entries(removed)) {
  assert.deepEqual(Object.keys(migrated[page]), Object.keys(defaults.copy[page]));
  for (const prefix of prefixes) {
    assert.equal(Object.keys(migrated[page]).some(key => key.startsWith(prefix)), false);
    const invalid = structuredClone(migrated);
    invalid[page][`${prefix} 旧字段`] = '不能重新保存';
    assert.throws(() => validateContent('copy', invalid), /不支持的字段/);
  }
}
const renamed = structuredClone(legacy);
renamed.说说页['08 发布名称'] = '新名称';
assert.equal(migratePageCopy(renamed).说说页['08 发布名称'], '新名称');
assert.deepEqual(migrated.写作页, legacy.写作页);
console.log('PASS legacy copy migration, publisher preservation, removed fields, new schema validation and idempotency');

const { Window } = await import('happy-dom');
const window = new Window({ url: 'http://localhost:3000/admin' });
for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node', 'NodeFilter', 'Event', 'MouseEvent', 'MutationObserver', 'getComputedStyle']) {
  const value = name === 'window' ? window : window[name];
  Object.defineProperty(globalThis, name, {
    value: name === 'getComputedStyle' ? value.bind(window) : value,
    configurable: true,
  });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createElement: h } = await import('react');
const { render, screen, fireEvent, cleanup } = await import('@testing-library/react');
const { AdminPageEditor } = await import('../components/admin-page-editor.tsx');
try {
  render(h(AdminPageEditor, {
    section: 'copy', value: migrated, sample: defaults.copy, saved: migrated,
    onChange: () => {},
  }));
  fireEvent.click(screen.getByRole('button', { name: /说说页/ }));
  assert.equal(screen.queryByText('说说封面'), null);
  assert.equal(screen.getByLabelText('08 发布名称').value, '自定义发布者');
  assert.equal(screen.queryByLabelText('08 开发阿雷'), null);
  for (const prefix of removed.说说页)
    assert.equal(screen.queryByLabelText(new RegExp(`^${prefix} `)), null);
  fireEvent.click(screen.getByRole('button', { name: /项目页/ }));
  for (const prefix of removed.项目页)
    assert.equal(screen.queryByLabelText(new RegExp(`^${prefix} `)), null);
  assert.equal(screen.getByLabelText('07 不只陈列结果，').value, '保留项目介绍');
  console.log('PASS admin copy forms hide retired fields and expose publisher name');
} finally {
  cleanup();
  await window.happyDOM.close();
}
