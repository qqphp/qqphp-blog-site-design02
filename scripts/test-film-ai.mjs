import assert from 'node:assert/strict';
import { register } from 'node:module';
register('./film-ai-test-loader.mjs', import.meta.url);
const { defaults } = await import('../lib/cms-defaults.ts');
const settings = {
  ...defaults.aiSettings,
  filmCoverPrompt: 'FILM {{title}} / {{director}} / {{style}}',
  filmCoverStyle: 'PORTRAIT FILM',
  imageModel: 'test-image-model',
};
const stored = [];
const requests = [];
globalThis.__filmTestBindings = {
  TEAMOROUTER_KEY: 'test-only-key',
  DB: {
    prepare: () => ({
      all: async () => ({
        results: [
          { key: 'aiSettings', value: JSON.stringify(settings), revision: 1 },
        ],
      }),
    }),
  },
  MEDIA: { put: async (...args) => stored.push(args) },
};
const png =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6L1sAAAAASUVORK5CYII=';
const originalFetch = globalThis.fetch;
let fail = false;
globalThis.fetch = async (url, init) => {
  assert.equal(
    String(url),
    'https://api.teamorouter.com/v1/images/generations',
  );
  assert.equal(init.headers.Authorization, 'Bearer test-only-key');
  requests.push(JSON.parse(init.body));
  return fail
    ? Response.json({ error: 'failure' }, { status: 502 })
    : Response.json({ data: [{ b64_json: png }] });
};
try {
  const { generateCover } = await import('../lib/ai-provider.ts');
  const result = await generateCover(
    '影片名称',
    '',
    undefined,
    false,
    '导演姓名',
  );
  assert.equal(requests[0].model, 'test-image-model');
  assert.equal(requests[0].prompt, 'FILM 影片名称 / 导演姓名 / PORTRAIT FILM');
  assert.match(result.url, /^\/api\/media\/.+\.png$/);
  assert.equal(
    result.generatedFor,
    JSON.stringify(['影片名称', '导演姓名', '9:16']),
  );
  assert.equal(requests[0].size, '864x1536');
  assert.equal(stored.length, 1);
  assert.deepEqual(Buffer.from(stored[0][1]), Buffer.from(png, 'base64'));
  assert.equal(stored[0][2].httpMetadata.contentType, 'image/png');
  const playlist = await generateCover(
    '歌单名称',
    '夜晚听的音乐',
    undefined,
    false,
    undefined,
    true,
  );
  assert.equal(requests[1].size, '1024x1024');
  assert.ok(requests[1].prompt.includes('歌单名称'));
  assert.ok(requests[1].prompt.includes('夜晚听的音乐'));
  assert.equal(
    playlist.generatedFor,
    JSON.stringify(['歌单名称', '夜晚听的音乐', '1:1']),
  );
  const podcast = await generateCover(
    '播客标题',
    '节目简介',
    undefined,
    false,
    undefined,
    false,
    '主播姓名',
  );
  assert.equal(requests[2].size, '1536x1024');
  for (const value of [
    '播客标题',
    '节目简介',
    '主播姓名',
    settings.podcastCoverStyle,
  ])
    assert.ok(requests[2].prompt.includes(value));
  assert.equal(
    podcast.generatedFor,
    JSON.stringify(['播客标题', '节目简介', '主播姓名', '3:2']),
  );
  fail = true;
  await assert.rejects(
    () => generateCover('影片名称', '故事简介', undefined, false, '导演姓名'),
    /502/,
  );
  assert.equal(stored.length, 3, 'Failure must not write or replace image');
  assert.equal(requests.length, 4, 'No automatic retries');
  console.log(
    'PASS film cover settings, film title/director and playlist title/synopsis prompts with 9:16 and 1:1 sizes, model request, PNG storage and failed generation without retries (no paid calls)',
  );
} finally {
  globalThis.fetch = originalFetch;
  delete globalThis.__filmTestBindings;
}
