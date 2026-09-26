import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import pg from 'pg';

export async function checkContentManagement({ request, origin, testUrl, defaults }) {
  const db = new pg.Client({ connectionString: testUrl.toString() });
  await db.connect();
  const getHtml = async (path) => {
    const response = await fetch(origin + path);
    assert.equal(response.status, 200);
    return response.text();
  };
  const assertTime = (before, after) => {
    assert.equal(after.createdAt, before.createdAt);
    assert.ok(after.updatedAt > before.updatedAt, '保存成功应推进更新时间');
  };
  const seed = () => {
    const run = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/seed-missing-sections.mjs'],
      { encoding: 'utf8', env: { ...process.env, DATABASE_URL: testUrl.toString() } });
    assert.equal(run.status, 0, run.stderr);
  };
  try {
    for (const old of ['aiNotes', 'prompt']) {
      assert.equal((await request(`/api/admin/records/${old}/root`)).status, 400);
      assert.equal((await request(`/api/admin/config/${old}/root`)).status, 400);
    }
    for (const collection of ['agents', 'skills', 'relays']) {
      const base = `/api/admin/records/ai/${collection}`;
      const value = { ...defaults.ai[collection][0], id: `test-${collection}`,
        name: `Managed ${collection}`, title: `Managed ${collection}`,
        href: 'https://example.com/resource', _published: false };
      // Preserve each collection's existing schema.
      if (collection !== 'skills') delete value.title;
      const created = await request(base, 'POST', { value });
      assert.equal(created.status, 200, JSON.stringify(created.data));
      assert.match(created.data.value.createdAt, /^\d{4}-.*Z$/);
      assert.equal((await getHtml('/ai')).includes(`Managed ${collection}`), false);
      const path = `${base}/${value.id}`;
      for (const href of ['javascript:alert(1)', '/relative', 'ftp://example.com']) {
        assert.equal((await request(path, 'PUT', { value: { ...created.data.value, href }, revision: 1 })).status, 400);
      }
      const unchanged = await request(path);
      assert.deepEqual(unchanged.data, { value: created.data.value, revision: 1 });
      const edited = await request(path, 'PUT', { value: { ...created.data.value,
        description: 'Persisted resource description', createdAt: '2000-01-01T00:00:00Z',
        updatedAt: '2099-01-01T00:00:00Z' }, revision: 1 });
      assert.equal(edited.status, 200, JSON.stringify(edited.data));
      assertTime(created.data.value, edited.data.value);
      const published = await request(path, 'PATCH', { published: true, revision: 2 });
      assert.equal(published.status, 200);
      assertTime(edited.data.value, published.data.value);
      assert.ok((await getHtml('/ai')).includes(`Managed ${collection}`));
      assert.equal((await db.query('SELECT payload->>\'description\' AS description FROM cms_entries WHERE section=\'ai\' AND collection=$1 AND id=$2',
        [collection, value.id])).rows[0].description, 'Persisted resource description');
      const result = await request(`${base}?q=Managed&size=1&page=1&status=published`);
      assert.equal(result.data.total, 1);
      assert.equal(result.data.items[0].id, value.id);
      const initial = await request(`${base}?size=50`);
      const last = initial.data.items.at(-1);
      assert.equal(last.id, value.id);
      assert.equal((await request(`${path}/move`, 'POST', { direction: -1, revision: 3 })).status, 200);
      const reordered = await request(`${base}?size=50`);
      assert.equal(reordered.data.items.at(-2).id, value.id);
      const page = await request(`${base}?size=1&page=2`);
      assert.equal(page.data.items[0].id, reordered.data.items[1].id);
      const draft = await request(path, 'PATCH', { published: false, revision: 4 });
      assert.equal(draft.status, 200);
      assert.equal((await getHtml('/ai')).includes(`Managed ${collection}`), false);
      assert.equal((await request(path, 'DELETE', { revision: 5 })).status, 200);
      const seeded = await request(`${base}?size=1`);
      const deletedId = seeded.data.items[0].id;
      assert.equal((await request(`${base}/${deletedId}`, 'DELETE', { revision: seeded.data.items[0].revision })).status, 200);
      seed(); seed();
      assert.equal((await request(`${base}/${deletedId}`)).status, 404, '初始化不得重新添加已删除资源');
    }

    const column = { id: 'new-investment-column', title: '新增研究栏目', description: '单层栏目' };
    const columnsBase = '/api/admin/records/investing/sections';
    const columnCreated = await request(columnsBase, 'POST', { value: column });
    assert.equal(columnCreated.status, 200, JSON.stringify(columnCreated.data));
    assert.equal((await request(columnsBase, 'POST', { value: { ...column, id: 'invalid-parent', parentId: 'trends' } })).status, 400);
    const entriesBase = '/api/admin/records/investing/entries';
    const article = { ...defaults.investing.sections[0].entries[0], id: 'time-investment-one',
      title: '同名投资文章', sectionId: column.id, _published: true,
      paragraphs: ['## 完整 Markdown\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\n> 引用\n\n- 列表\n\n```js\nconst x = 1;\n```\n\n<script>alert(1)</script>'] };
    const first = await request(entriesBase, 'POST', { value: article });
    assert.equal(first.status, 200, JSON.stringify(first.data));
    const second = await request(entriesBase, 'POST', { value: { ...article,
      id: 'time-investment-two', sectionId: 'review', paragraphs: ['第二篇正文'] } });
    assert.equal(second.status, 200);
    assert.ok(second.data.value.createdAt > first.data.value.createdAt);
    const firstPath = `${entriesBase}/${article.id}`;
    const edited = await request(firstPath, 'PUT', { value: { ...first.data.value, description: '更新较早的文章',
      createdAt: '2099-01-01T00:00:00Z' }, revision: 1 });
    assert.equal(edited.status, 200);
    assertTime(first.data.value, edited.data.value);
    const sorted = await request(entriesBase);
    assert.deepEqual(sorted.data.items.slice(0, 2).map((item) => item.id), ['time-investment-two', article.id]);
    assert.equal((await request(`${firstPath}/move`, 'POST', { direction: -1, revision: 2 })).status, 400);
    assert.equal((await request(`${columnsBase}/${column.id}`, 'DELETE', { revision: 1 })).status, 400);
    const renamed = await request(`${columnsBase}/${column.id}`, 'PUT', {
      value: { ...column, title: '自定义研究名称' }, revision: 1 });
    assert.equal(renamed.status, 200);
    const html = await getHtml('/investing');
    assert.ok(html.includes('自定义研究名称'));
    assert.ok(html.includes('第二篇正文'), '最新文章默认选中');
    assert.equal((await request(firstPath, 'DELETE', { revision: 2 })).status, 200);
    assert.equal((await request(`${columnsBase}/${column.id}`, 'DELETE', { revision: 2 })).status, 200);

    for (const [section, collection, sample, identity] of [
      ['writing', 'articles', defaults.writing[0], 'slug'],
      ['projects', 'items', defaults.projects.items[0], 'id'],
    ]) {
      const value = { ...sample, [identity]: `time-${section}`, _published: false,
        createdAt: '2000-01-01T00:00:00Z', updatedAt: '2099-01-01T00:00:00Z' };
      const base = `/api/admin/records/${section}/${collection}`;
      const created = await request(base, 'POST', { value });
      assert.equal(created.status, 200, JSON.stringify(created.data));
      assert.ok(created.data.value.createdAt > '2026-01-01');
      const path = `${base}/${value[identity]}`;
      const edit = await request(path, 'PUT', { value: { ...created.data.value, title: '时间验收更新',
        createdAt: '2099-01-01T00:00:00Z' }, revision: 1 });
      assert.equal(edit.status, 200);
      assertTime(created.data.value, edit.data.value);
      const published = await request(path, 'PATCH', { published: true, revision: 2 });
      assert.equal(published.status, 200);
      assertTime(edit.data.value, published.data.value);
      assert.equal((await request(path, 'PUT', { value: edit.data.value, revision: 1 })).status, 409);
      assert.equal((await request(path)).data.value.updatedAt, published.data.value.updatedAt);
      assert.equal((await request(path, 'DELETE', { revision: 3 })).status, 200);
    }
    // Test saved empty/draft states, without touching the user's database.
    await db.query("UPDATE cms_entries SET published=false,payload=jsonb_set(payload,'{_published}','false') WHERE section='ai'");
    const emptyAi = await getHtml('/ai');
    for (const item of [...defaults.ai.agents, ...defaults.ai.skills, ...defaults.ai.relays])
      assert.equal(emptyAi.includes(item.title ?? item.name), false, '草稿不能回退到静态资源');
    await db.query("DELETE FROM cms_entries WHERE section='ai'");
    seed();
    assert.equal((await request('/api/admin/records/ai/agents')).data.total, 0);
    await db.query("UPDATE cms_entries SET published=false,payload=jsonb_set(payload,'{_published}','false') WHERE section='investing' AND collection='entries'");
    assert.ok((await getHtml('/investing')).includes('暂无文章'));
    console.log('PASS AI persistence/publication/order/pagination/empty/idempotent seed, investing columns/references/newest selection, immutable server times and retired endpoints');
  } finally { await db.end(); }
}
