import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import {
  readFileSync,
  mkdirSync,
  writeFileSync,
  readdirSync,
  cpSync,
  symlinkSync,
} from 'node:fs';
import { resolve } from 'node:path';

// An isolated local D1/R2 directory keeps checks away from the user's content.
const state = resolve('.wrangler', `cms-test-${Date.now()}`);
const checkout = resolve('work', `cms-test-app-${Date.now()}`);
const base = 'http://localhost:3107';
const password = readFileSync('.dev.vars', 'utf8')
  .match(/^ADMIN_PASSWORD=(.+)$/m)?.[1]
  .trim();
assert.ok(password, 'Run npm run admin:password before the integration test.');
mkdirSync(state, { recursive: true });
mkdirSync(checkout, { recursive: true });
for (const entry of readdirSync('.')) {
  if (
    [
      '.git',
      '.wrangler',
      'node_modules',
      'dist',
      'work',
      'outputs',
      '.vinext',
      '.next',
    ].includes(entry)
  )
    continue;
  cpSync(entry, resolve(checkout, entry), { recursive: true });
}
mkdirSync(resolve(checkout, 'node_modules'));
for (const entry of readdirSync('node_modules', { withFileTypes: true })) {
  if (entry.isDirectory() && !entry.name.startsWith('.'))
    symlinkSync(
      resolve('node_modules', entry.name),
      resolve(checkout, 'node_modules', entry.name),
      process.platform === 'win32' ? 'junction' : 'dir',
    );
}
const migration = spawnSync(
  process.execPath,
  [
    'node_modules/wrangler/bin/wrangler.js',
    'd1',
    'migrations',
    'apply',
    'DB',
    '--local',
    '--config',
    'wrangler.local.json',
    '--persist-to',
    state,
  ],
  { encoding: 'utf8', env: { ...process.env, WRANGLER_SEND_METRICS: 'false' } },
);
assert.equal(migration.status, 0, migration.stderr || migration.stdout);
let log = '';
function startServer() {
  const child = spawn(
    process.execPath,
    [resolve('node_modules/vinext/dist/cli.js'), 'dev', '--port', '3107'],
    {
      cwd: checkout,
      env: { ...process.env, CMS_TEST_STATE: state },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  child.stdout.on('data', (data) => {
    log += data;
  });
  child.stderr.on('data', (data) => {
    log += data;
  });
  return child;
}
function stopServer() {
  if (process.platform === 'win32')
    spawnSync('taskkill', ['/PID', String(server.pid), '/T', '/F'], {
      stdio: 'ignore',
    });
  else server.kill('SIGTERM');
}
let server = startServer();
let cookie = '';
async function request(
  path,
  { method = 'GET', body, auth = true, origin = base, headers = {} } = {},
) {
  const options = {
    method,
    headers: {
      ...(auth && cookie ? { Cookie: cookie } : {}),
      ...(method !== 'GET'
        ? { Origin: origin, 'Content-Type': 'application/json' }
        : {}),
      ...headers,
    },
    signal: AbortSignal.timeout(30000),
  };
  if (method !== 'GET' && body !== undefined)
    options.body = JSON.stringify(body);
  const response = await fetch(base + path, options);
  const text = await response.text();
  return {
    status: response.status,
    text,
    headers: response.headers,
    json: () => JSON.parse(text),
  };
}
function check(result, status) {
  assert.equal(result.status, status, result.text.slice(0, 1000));
}
async function waitForServer() {
  let ready = false;
  for (let i = 0; i < 90; i++) {
    if (server.exitCode !== null) throw new Error(`Server stopped: ${log}`);
    try {
      const result = await request('/api/admin/session', { auth: false });
      if (result.status === 200) {
        ready = true;
        break;
      }
    } catch {
      /* Wait for compilation. */
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert.ok(ready, `Server did not start: ${log}`);
}
try {
  await waitForServer();
  console.log('PASS isolated local server and migrations');
  check(await request('/api/admin/content', { auth: false }), 401);
  check(await request('/api/admin/media', { auth: false }), 401);
  check(await request('/api/admin/ai', { auth: false }), 401);
  check(
    await request('/api/admin/session', {
      method: 'POST',
      body: { password: 'wrong-password' },
    }),
    401,
  );
  const login = await request('/api/admin/session', {
    method: 'POST',
    body: { password },
  });
  check(login, 200);
  cookie = login.headers.get('set-cookie').split(';')[0];
  assert.match(login.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
  check(
    await request('/api/admin/content', {
      method: 'PUT',
      origin: 'https://example.invalid',
      body: {},
    }),
    403,
  );
  console.log('PASS login, unauthorized access and cross-origin protection');
  const documents = (await request('/api/admin/content')).json();
  const revisions = { ...documents.revisions };
  async function save(
    key,
    value,
    revision = revisions[key] ?? 0,
    expected = 200,
  ) {
    const result = await request('/api/admin/content', {
      method: 'PUT',
      body: { key, value, revision },
    });
    check(result, expected);
    if (expected === 200) revisions[key] = result.json().revision;
    return result;
  }
  for (const [key, value] of Object.entries(documents.content))
    await save(key, value);
  const story = documents.content.stories[0];
  for (const path of ['/api/comments', '/api/admin/comments']) {
    check(await request(path, { auth: false }), 404);
    check(
      await request(path, {
        method: 'POST',
        body: { storyId: story.id, author: 'test', body: 'test' },
      }),
      404,
    );
  }
  const changedStories = structuredClone(documents.content.stories);
  changedStories[0].topics = ['##开发', '＃日常'];
  changedStories[0].date = '2026-09-08T23:59:58+08:00';
  changedStories[0].text = 'ORDER_OLDER_STORY';
  changedStories[1].date = '2026-09-09T00:00:01+08:00';
  changedStories[1].text = 'ORDER_NEWER_STORY';
  changedStories.push({
    ...changedStories[0],
    id: 'default-draft-check',
    date: '2030-01-01T00:00:01+08:00',
    text: 'UNPUBLISHED_STORY_SENTINEL',
    _published: false,
  });
  await save('stories', changedStories);
  const notesHtml = (await request('/notes', { auth: false })).text;
  assert.match(notesHtml, /开发/);
  assert.match(notesHtml, /日常/);
  assert.match(notesHtml, /23:59:58/);
  const renderedPosts =
    notesHtml.match(/<article class="story-post"[\s\S]*?<\/article>/g) ?? [];
  assert.ok(renderedPosts.length >= 2);
  assert.match(renderedPosts[0], /ORDER_NEWER_STORY/);
  assert.match(renderedPosts[1], /ORDER_OLDER_STORY/);
  assert.match(renderedPosts[1], /class="story-post-topics"/);
  assert.match(renderedPosts[1], /#(?:<!-- -->)?开发/);
  assert.doesNotMatch(renderedPosts[1], /##|＃/);
  assert.doesNotMatch(notesHtml, /UNPUBLISHED_STORY_SENTINEL/);
  assert.doesNotMatch(notesHtml, /评论与回复/);
  assert.doesNotMatch(notesHtml, /title="点赞暂未开放"/);
  assert.deepEqual(
    (await request('/api/admin/content')).json().content.stories[0].topics,
    ['开发', '日常'],
  );
  const invalidStories = structuredClone(changedStories);
  invalidStories[0].date = '2026-02-30T23:59:58+08:00';
  await save('stories', invalidStories, revisions.stories, 400);
  invalidStories[0].date = changedStories[0].date;
  invalidStories[0].topics = ['重复', '重复'];
  await save('stories', invalidStories, revisions.stories, 400);
  await save('stories', documents.content.stories);
  console.log(
    'PASS story topics, second precision, validation and removed comment routes',
  );
  console.log(
    `PASS validation and persistence roundtrip for all ${Object.keys(documents.content).length} sections`,
  );
  check(
    await request('/api/admin/ai', {
      method: 'POST',
      body: { action: 'unknown' },
    }),
    400,
  );
  check(
    await request('/api/admin/ai', {
      method: 'POST',
      body: { action: 'cover', title: '', excerpt: '' },
    }),
    400,
  );
  check(
    await request('/api/admin/ai', {
      method: 'POST',
      body: {
        action: 'project-cover',
        title: '项目',
        excerpt: '摘要',
        subtitle: 42,
      },
    }),
    400,
  );
  const aiSettings = {
    ...documents.content.aiSettings,
    coverPrompt: 'PRIVATE_AI_PROMPT {{title}} {{excerpt}} {{style}}',
    projectImagePrompt:
      'PRIVATE_PROJECT_PROMPT {{title}} {{subtitle}} {{excerpt}} {{style}}',
  };
  await save('aiSettings', aiSettings);
  assert.ok(
    !(await request('/', { auth: false })).text.includes(
      'PRIVATE_PROJECT_PROMPT',
    ),
  );
  await save(
    'aiSettings',
    { ...aiSettings, projectImagePrompt: 'no placeholders' },
    revisions.aiSettings,
    400,
  );
  assert.ok(
    !(await request('/', { auth: false })).text.includes('PRIVATE_AI_PROMPT'),
  );
  await save(
    'aiSettings',
    { ...aiSettings, coverPrompt: 'missing placeholders' },
    revisions.aiSettings,
    400,
  );
  await save(
    'aiSettings',
    { ...aiSettings, baseUrl: 'http://localhost:1234/v1' },
    revisions.aiSettings,
    400,
  );
  const categories = structuredClone(documents.content.categories);
  // Simulate articles saved before category IDs existed, then rename a category
  // before the user has re-saved any article in the new editor.
  const legacySql = resolve(state, 'legacy-articles.sql');
  writeFileSync(
    legacySql,
    "UPDATE cms_documents SET value = (SELECT json_group_array(json_remove(article.value, '$.categoryId', '$.coverMode', '$.coverGeneratedFor')) FROM json_each(cms_documents.value) AS article) WHERE key = 'writing'; UPDATE cms_documents SET value = (SELECT json_group_array(json_remove(category.value, '$.parentId')) FROM json_each(cms_documents.value) AS category) WHERE key = 'categories';",
  );
  writeFileSync(
    legacySql,
    readFileSync(legacySql, 'utf8') +
      " UPDATE cms_documents SET value = (SELECT json_group_array(json_set(json_remove(story.value, '$.topics'), '$.topic', json_extract(story.value, '$.topics[0]'), '$.reactions', '旧点赞', '$.replies', json_array('旧示例回复'))) FROM json_each(cms_documents.value) AS story) WHERE key = 'stories';",
  );
  const legacy = spawnSync(
    process.execPath,
    [
      'node_modules/wrangler/bin/wrangler.js',
      'd1',
      'execute',
      'DB',
      '--local',
      '--config',
      'wrangler.local.json',
      '--persist-to',
      state,
      '--file',
      legacySql,
    ],
    { encoding: 'utf8' },
  );
  assert.equal(legacy.status, 0, legacy.stderr || legacy.stdout);
  const migratedStories = (await request('/api/admin/content')).json().content
    .stories;
  assert.deepEqual(
    migratedStories[0].topics,
    documents.content.stories[0].topics,
  );
  assert.equal(migratedStories[0].id, story.id);
  assert.equal('reactions' in migratedStories[0], false);
  assert.equal('replies' in migratedStories[0], false);
  assert.equal('topic' in migratedStories[0], false);
  await save('stories', migratedStories);
  console.log(
    'PASS saved legacy stories migrate without losing topics, images or stable IDs',
  );
  assert.ok(
    (await request('/api/admin/content'))
      .json()
      .content.categories.every((item) => item.parentId === ''),
  );
  const oldName = categories[0].name;
  categories[0].name = '旧文章分类改名';
  await save('categories', categories);
  const migrated = (await request('/api/admin/content')).json().content.writing;
  const migratedArticle = migrated.find(
    (item) => item.categoryId === categories[0].id,
  );
  assert.equal(migratedArticle.category, categories[0].name);
  assert.equal(migratedArticle.coverMode, 'upload');
  categories[0].name = oldName;
  await save('categories', categories);
  const addedCategory = {
    id: 'integration-category',
    parentId: categories[0].id,
    name: '测试独立分类',
    description: '测试分类说明',
  };
  categories.push(addedCategory);
  await save('categories', categories);
  assert.equal(
    (await request('/api/admin/content')).json().content.categories.at(-1)
      .parentId,
    categories[0].id,
  );
  await save(
    'categories',
    categories.map((item) =>
      item.id === categories[0].id
        ? { ...item, parentId: addedCategory.id }
        : item,
    ),
    revisions.categories,
    400,
  );
  await save(
    'categories',
    categories.map((item) =>
      item.id === addedCategory.id ? { ...item, parentId: item.id } : item,
    ),
    revisions.categories,
    400,
  );
  await save(
    'categories',
    categories.filter((item) => item.id !== categories[0].id),
    revisions.categories,
    400,
  );
  await save(
    'categories',
    categories.map((item) =>
      item.id === addedCategory.id
        ? { ...item, parentId: 'missing-parent' }
        : item,
    ),
    revisions.categories,
    400,
  );
  const categorized = structuredClone(documents.content.writing);
  categorized[0].categoryId = addedCategory.id;
  await save('writing', categorized);
  addedCategory.name = '测试分类改名';
  await save('categories', categories);
  assert.equal(
    (await request('/api/admin/content')).json().content.writing[0].category,
    addedCategory.name,
  );
  assert.ok(
    (await request('/writing', { auth: false })).text.includes(
      addedCategory.name,
    ),
  );
  await save(
    'categories',
    documents.content.categories,
    revisions.categories,
    400,
  );
  await save(
    'writing',
    categorized.map((item, i) =>
      i === 0 ? { ...item, categoryId: 'missing-category' } : item,
    ),
    revisions.writing,
    400,
  );
  await save(
    'writing',
    categorized.map((item, i) =>
      i === 0 ? { ...item, date: '2026.02.30' } : item,
    ),
    revisions.writing,
    400,
  );
  await save('writing', documents.content.writing);
  await save('categories', documents.content.categories);
  console.log(
    'PASS AI settings privacy/validation, category CRUD/rename/references and calendar date validation (no paid API requests)',
  );
  const articles = structuredClone(documents.content.writing);
  const projectData = structuredClone(documents.content.projects);
  projectData.items[0].body =
    '## PROJECT_MARKDOWN_SENTINEL\n\n项目说明正文\n\n<script>alert(123)</script>';
  projectData.statuses[0].name = '测试项目状态改名';
  projectData.categories[0].name = '测试项目分类改名';
  await save('projects', projectData);
  const savedProject = (await request('/api/admin/content')).json().content
    .projects;
  assert.equal(savedProject.items[0].status, projectData.statuses[0].name);
  assert.equal(savedProject.items[0].category, projectData.categories[0].name);
  const projectPage = await request('/projects');
  check(projectPage, 200);
  assert.ok(projectPage.text.includes('<h2>PROJECT_MARKDOWN_SENTINEL</h2>'));
  assert.ok(!projectPage.text.includes('<script>alert(123)</script>'));
  assert.ok(!projectPage.text.includes('class="folio-question"'));
  assert.ok(!projectPage.text.includes('class="folio-decisions"'));
  await save(
    'projects',
    { ...projectData, statuses: projectData.statuses.slice(1) },
    revisions.projects,
    400,
  );
  await save(
    'projects',
    { ...projectData, categories: projectData.categories.slice(1) },
    revisions.projects,
    400,
  );
  await save(
    'projects',
    {
      ...projectData,
      categories: [
        ...projectData.categories,
        {
          id: 'duplicate-project-category',
          name: projectData.categories[0].name,
        },
      ],
    },
    revisions.projects,
    400,
  );
  const emptyProjects = { ...projectData, items: [] };
  await save('projects', emptyProjects);
  check(await request('/projects'), 200);
  await save('projects', documents.content.projects);
  console.log(
    'PASS project taxonomy rename/references, Markdown rendering/safety and empty project page',
  );
  const draft = {
    ...articles[0],
    slug: 'cms-test-draft',
    title: 'CMS_PRIVATE_DRAFT_SENTINEL',
    body: 'CMS_PRIVATE_BODY_SENTINEL',
    _published: false,
  };
  articles.push(draft);
  await save('writing', articles);
  for (const path of ['/', '/writing', '/admin']) {
    const page = await request(path, { auth: false });
    check(page, 200);
    assert.ok(!page.text.includes('CMS_PRIVATE_DRAFT_SENTINEL'));
    assert.ok(!page.text.includes('CMS_PRIVATE_BODY_SENTINEL'));
  }
  check(await request('/writing/cms-test-draft', { auth: false }), 404);
  draft._published = true;
  draft.title = 'CMS_PUBLISHED_SENTINEL';
  draft.body = '## CMS_HEADING\n\nCMS_SAVED_BODY\n\n<script>alert(1)</script>';
  await save('writing', articles);
  const article = await request('/writing/cms-test-draft', { auth: false });
  check(article, 200);
  assert.ok(article.text.includes('CMS_PUBLISHED_SENTINEL'));
  assert.ok(article.text.includes('CMS_SAVED_BODY'));
  assert.ok(article.text.includes('id="heading-1"'));
  assert.ok(!article.text.includes('<script>alert(1)</script>'));
  const reread = (await request('/api/admin/content')).json();
  assert.equal(reread.content.writing.at(-1).body, draft.body);
  await save('writing', articles, 1, 409);
  await save('writing', [...articles, articles[0]], revisions.writing, 400);
  const invalid = structuredClone(documents.content.bookmarks);
  invalid[0].url = 'javascript:alert(1)';
  await save('bookmarks', invalid, revisions.bookmarks, 400);
  await save(
    'writing',
    articles.map((item, i) =>
      i === 0 ? { ...item, _published: 'false' } : item,
    ),
    revisions.writing,
    400,
  );
  console.log(
    'PASS draft privacy, publishing, Markdown, stale revisions and invalid records',
  );
  const home = { ...documents.content.home, title: 'CMS_HOME_SENTINEL' };
  await save('home', home);
  assert.ok(
    (await request('/', { auth: false })).text.includes('CMS_HOME_SENTINEL'),
  );
  // Upload a real existing image, verify bytes, listing and partial delivery.
  const image = readFileSync('public/favicon.ico');
  const badUpload = await fetch(base + '/api/admin/media', {
    method: 'POST',
    headers: { Origin: base, Cookie: cookie },
    body: image,
  });
  assert.equal(badUpload.status, 400);
  const bytes = readFileSync('public/stories-lake.png');
  const uploaded = await fetch(base + '/api/admin/media', {
    method: 'POST',
    headers: {
      Origin: base,
      Cookie: cookie,
      'X-File-Name': encodeURIComponent('测试图片.png'),
    },
    body: bytes,
  });
  assert.equal(uploaded.status, 200);
  const media = await uploaded.json();
  const retrieved = await fetch(base + media.url);
  assert.equal(retrieved.status, 200);
  assert.equal(retrieved.headers.get('content-type'), 'image/png');
  assert.deepEqual(Buffer.from(await retrieved.arrayBuffer()), bytes);
  const ranged = await fetch(base + media.url, {
    headers: { Range: 'bytes=0-15' },
  });
  assert.equal(ranged.status, 206);
  assert.equal((await ranged.arrayBuffer()).byteLength, 16);
  const library = (await request('/api/admin/media')).json();
  assert.ok(library.files.some((item) => item.url === media.url));
  console.log(
    'PASS homepage edits, media upload, byte integrity and range requests',
  );
  stopServer();
  await new Promise((resolve) => setTimeout(resolve, 500));
  server = startServer();
  await waitForServer();
  const persisted = (await request('/api/admin/content')).json();
  assert.equal(persisted.content.home.title, 'CMS_HOME_SENTINEL');
  assert.equal(persisted.content.writing.at(-1).body, draft.body);
  assert.equal((await fetch(base + media.url)).status, 200);
  console.log(
    'PASS database, session and uploaded file persistence after server restart',
  );
  await save('writing', []);
  for (const [key, value] of Object.entries(documents.content)) {
    if (Array.isArray(value)) await save(key, []);
    else if (key === 'projects') await save(key, { ...value, items: [] });
    else if (value.entries) await save(key, { ...value, entries: [] });
    else if (key === 'investing') await save(key, { ...value, sections: [] });
  }
  for (const path of [
    '/',
    '/writing',
    '/projects',
    '/notes',
    '/about',
    '/ai',
    '/investing',
    '/bookmarks',
    '/friends',
    '/music',
    '/films',
    '/podcasts',
    '/travel',
    '/hobbies',
    '/books',
    '/admin',
  ])
    check(await request(path, { auth: false }), 200);
  console.log('PASS 16 public/admin routes with empty collections');
  check(await request('/api/admin/session', { method: 'DELETE' }), 200);
  cookie = '';
  for (let i = 0; i < 10; i++)
    check(
      await request('/api/admin/session', {
        method: 'POST',
        body: { password: 'wrong-password' },
      }),
      401,
    );
  check(
    await request('/api/admin/session', {
      method: 'POST',
      body: { password: 'wrong-password' },
    }),
    429,
  );
  console.log('PASS logout and durable login throttling');
  console.log('CMS integration checks passed. User content was not modified.');
} finally {
  writeFileSync(resolve(state, 'server.log'), log);
  stopServer();
}
