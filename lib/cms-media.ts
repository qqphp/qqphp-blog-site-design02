import type { Content, Section } from './cms-defaults';

const imageKeyPattern = /^\/api\/media\/([a-f0-9-]+\.(?:png|jpg|gif|webp))$/;

function imageKeys(value: unknown, keys = new Set<string>()) {
  if (typeof value === 'string') {
    const match = imageKeyPattern.exec(value);
    if (match) keys.add(match[1]);
    return keys;
  }
  if (Array.isArray(value)) {
    for (const item of value) imageKeys(item, keys);
    return keys;
  }
  if (value && typeof value === 'object')
    for (const item of Object.values(value)) imageKeys(item, keys);
  return keys;
}

function owners(key: Section, value: unknown): Map<string, unknown> {
  const result = new Map<string, unknown>();
  const add = (prefix: string, items: unknown) => {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      const id =
        'id' in item ? item.id : 'slug' in item ? item.slug : undefined;
      if (typeof id === 'string') result.set(`${prefix}:${id}`, item);
    }
  };
  if (key === 'writing' || key === 'stories') add('item', value);
  if (
    key === 'projects' ||
    key === 'films' ||
    key === 'podcasts' ||
    key === 'travel' ||
    key === 'hobbies'
  )
    add('item', (value as { items?: unknown })?.items);
  if (key === 'tracks') {
    add('item', (value as { items?: unknown })?.items);
    add('playlist', (value as { playlists?: unknown })?.playlists);
  }
  if (key === 'books') {
    add('item', (value as { items?: unknown })?.items);
    add('list', (value as { lists?: unknown })?.lists);
  }
  return result;
}

export function deletedRecordImageKeys(
  key: Section,
  previous: unknown,
  next: unknown,
) {
  const before = owners(key, previous);
  const after = owners(key, next);
  const deleted = new Set<string>();
  for (const [id, record] of before)
    if (!after.has(id)) imageKeys(record, deleted);
  return deleted;
}

export function referencedImageKeys(content: Content) {
  return imageKeys(content);
}
