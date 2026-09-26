import { defaults, type Section } from './cms-defaults';

export const adminCollections: Partial<Record<Section, readonly string[]>> = {
  writing: ['articles', 'categories'],
  projects: ['items', 'statuses', 'categories'],
  stories: ['root'],
  slides: ['root'],
  ai: ['agents', 'skills', 'relays'],
  investing: ['entries', 'sections'],
  bookmarks: ['items', 'categories'],
  friends: ['items', 'categories'],
  books: ['items', 'categories', 'lists'],
  tracks: ['items', 'scenes', 'playlists'],
  films: ['items', 'categories'],
  podcasts: ['items', 'categories'],
  travel: ['items', 'categories'],
  hobbies: ['items', 'categories'],
};

export const collectionLabels: Record<string, string> = {
  articles: '文章', categories: '分类', items: '内容', statuses: '项目状态',
  root: '内容', sections: '栏目', entries: '文章', lists: '书单',
  agents: '智能体', skills: '技能 Skills', relays: '中转站 API',
  scenes: '音乐场景', playlists: '歌单',
};

export const copyGroups = [
  { id: 'home', label: '首页', keys: ['首页栏目', '首页装饰'] },
  { id: 'writing', label: '写作页', keys: ['写作页'] },
  { id: 'projects', label: '项目页', keys: ['项目页'] },
  { id: 'stories', label: '说说页', keys: ['说说页', '说说图库'] },
  { id: 'about', label: '关于页', keys: ['关于页'] },
  { id: 'bookmarks', label: '书签页', keys: ['书签页'] },
  { id: 'friends', label: '友链页', keys: ['友链页'] },
  { id: 'books', label: '书籍页', keys: ['书籍页'] },
  { id: 'life', label: '生活栏目通用', keys: ['生活栏目'] },
  { id: 'player', label: '全站播放器', keys: ['音乐播放器'] },
  { id: 'navigation', label: '全站导航', keys: ['导航菜单'] },
] as const;

export function configScopes(section: Section) {
  if (section === 'ai' || section === 'investing') return [];
  if (section === 'copy') return copyGroups.map(({ id, label }) => ({ id, label }));
  const value = defaults[section];
  const collections = adminCollections[section] ?? [];
  const metadata = value && typeof value === 'object' && !Array.isArray(value)
    ? Object.keys(value).filter((key) => !collections.includes(key)) : [];
  return !collections.length || metadata.length ? [{ id: 'root', label: '设置' }] : [];
}

export function configKeys(section: Section, scope: string): readonly string[] | null {
  if (section === 'copy') return copyGroups.find((group) => group.id === scope)?.keys ?? null;
  return scope === 'root' && configScopes(section).length ? [] : null;
}

export function validCollection(section: Section, collection: string) {
  return adminCollections[section]?.includes(collection) ?? false;
}
