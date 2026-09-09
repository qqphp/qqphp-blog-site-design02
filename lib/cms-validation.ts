import { defaults, type Section } from './cms-defaults';
import { storyDate } from './story-content';

export type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [key: string]: Json };
export function isSection(key: string): key is Section {
  return Object.hasOwn(defaults, key);
}

export function validateContent(key: Section, value: unknown) {
  const walk = (
    input: unknown,
    sample: unknown,
    path: string,
    field = '',
  ): void => {
    const fail = (message: string): never => {
      throw new Error(`${path}：${message}`);
    };
    if (Array.isArray(sample)) {
      if (!Array.isArray(input)) fail('需要列表');
      const list = input as unknown[];
      if (list.length > 500) fail('最多 500 项');
      const itemSample = sample[0] ?? '';
      list.forEach((item, i) => walk(item, itemSample, `${path}[${i + 1}]`));
      for (const identity of ['id', 'slug']) {
        const ids = list.flatMap((item) =>
          item && typeof item === 'object' && identity in item
            ? [(item as Record<string, unknown>)[identity]]
            : [],
        );
        if (new Set(ids).size !== ids.length) fail(`${identity} 不能重复`);
      }
      if (field === 'images' && key === 'projects' && list.length === 0)
        fail('项目至少需要一张图片');
    } else if (sample && typeof sample === 'object') {
      if (!input || typeof input !== 'object' || Array.isArray(input))
        fail('需要对象');
      const object = input as Record<string, unknown>;
      for (const name of Object.keys(object))
        if (!Object.hasOwn(sample, name)) fail(`不支持的字段 ${name}`);
      for (const [name, example] of Object.entries(sample))
        walk(object[name], example, `${path}.${name}`, name);
    } else {
      if (typeof input !== typeof sample) fail(`需要 ${typeof sample}`);
      if (typeof input === 'string') {
        if (input.length > (field === 'body' ? 200000 : 30000))
          fail('文字过长');
        if (['id', 'slug', 'title', 'name'].includes(field) && !input.trim())
          fail('不能为空');
        if (['id', 'slug'].includes(field) && !/^[a-zA-Z0-9_-]+$/.test(input))
          fail('请使用英文、数字、短横线或下划线');
        if (
          /^(url|href|src|cover|image|publicAccountQr|serviceUrl|footerUrl)$/i.test(
            field,
          ) &&
          input
        ) {
          if (
            !/^(https?:\/\/|\/(?!\/)|#)/i.test(input) ||
            /[\s\\]/.test(input) ||
            Array.from(input).some((char) => char.charCodeAt(0) < 32)
          )
            fail('请使用 http(s) 地址或以 / 开头的本站路径');
          if (/^https?:/i.test(input)) {
            try {
              new URL(input);
            } catch {
              fail('网址无效');
            }
          }
        }
        if (
          (['src', 'image'].includes(field) ||
            (field === 'cover' && key !== 'writing')) &&
          !input.trim()
        )
          fail('请填写图片或音频地址');
        if (
          field === 'date' &&
          (!/^\d{4}[-.]\d{2}[-.]\d{2}/.test(input) ||
            !Number.isFinite(Date.parse(input.replaceAll('.', '-'))))
        )
          fail('日期格式无效');
        if (field === 'color' && !/^#[0-9a-f]{6}$/i.test(input))
          fail('请输入六位十六进制颜色');
      }
      if (
        typeof input === 'number' &&
        (!Number.isFinite(input) || input < 0 || input > 1000000)
      )
        fail('数值需要在 0 到 1000000 之间');
      if (['width', 'height', 'duration'].includes(field) && input === 0)
        fail('必须大于 0');
    }
  };
  walk(value, defaults[key], key);
  if (key === 'stories')
    for (const item of value as typeof defaults.stories) {
      if (item._published && !item.text.trim())
        throw new Error('发布说说前请填写文字');
      if (item.text.length > 5000) throw new Error('说说文字最多 5000 字');
      if (
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+08:00$/.test(item.date) ||
        storyDate(new Date(item.date)) !== item.date
      )
        throw new Error('请选择有效的年月日时分秒（北京时间）');
      if (
        item.topics.length > 20 ||
        item.topics.some((topic) => !topic.trim() || topic.length > 40) ||
        new Set(item.topics.map((topic) => topic.trim())).size !==
          item.topics.length
      )
        throw new Error('话题不能重复或为空，每个最多 40 字，最多 20 个');
    }
  if (key === 'aiSettings') {
    const settings = value as typeof defaults.aiSettings;
    validateProviderUrl(settings.baseUrl);
    if (!settings.textModel.trim() || !settings.imageModel.trim())
      throw new Error('请填写模型名称');
    if (
      !settings.coverPrompt.includes('{{title}}') ||
      !settings.coverPrompt.includes('{{excerpt}}')
    )
      throw new Error('封面提示词必须包含 {{title}} 和 {{excerpt}}');
  }
  if (key === 'aiSettings') {
    const settings = value as typeof defaults.aiSettings;
    if (
      !['title', 'subtitle', 'excerpt'].every((key) =>
        settings.projectImagePrompt.includes('{{' + key + '}}'),
      )
    )
      throw new Error('项目图片提示词须包含名称、副标题和摘要占位符');
  }
  if (key === 'bookmarks' || key === 'friends') {
    const document = value as typeof defaults.bookmarks;
    const names = document.categories.map((item) => item.name.trim());
    if (new Set(names).size !== names.length)
      throw new Error('分类名称不能重复');
    if (names.includes('全部'))
      throw new Error('“全部”用于筛选，请使用其他分类名称');
    for (const item of document.items) {
      if (!document.categories.some((option) => option.id === item.categoryId))
        throw new Error('请选择有效分类；删除分类前请调整关联条目（含草稿）');
      if (key === 'bookmarks' || item.url) {
        try {
          const url = new URL(item.url);
          if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
        } catch {
          throw new Error('请填写完整的 http(s) 网站地址');
        }
      }
    }
  }
  if (key === 'projects') {
    const document = value as typeof defaults.projects;
    for (const key of ['statuses', 'categories'] as const) {
      const names = document[key].map((item) => item.name.trim());
      if (new Set(names).size !== names.length)
        throw new Error('项目状态或分类名称不能重复');
    }
    for (const item of document.items) {
      if (item.images.some((image) => !['upload', 'ai'].includes(image.mode)))
        throw new Error('请选择项目图片来源');
      if (!document.statuses.some((option) => option.id === item.statusId))
        throw new Error('请选择有效项目状态；删除状态前请调整关联项目');
      if (!document.categories.some((option) => option.id === item.categoryId))
        throw new Error('请选择有效项目分类；删除分类前请调整关联项目');
    }
  }
  if (key === 'categories') {
    const items = value as typeof defaults.categories;
    const names = items.map((item) =>
      JSON.stringify([item.parentId, item.name.trim()]),
    );
    if (new Set(names).size !== names.length)
      throw new Error('同一层级的分类名称不能重复');
    const parents = new Map(items.map((item) => [item.id, item.parentId]));
    for (const item of items) {
      const visited = new Set([item.id]);
      let parent = item.parentId;
      while (parent) {
        if (!parents.has(parent))
          throw new Error('上级分类不存在，请先调整子分类');
        if (visited.has(parent)) throw new Error('分类不能属于自身或其子分类');
        visited.add(parent);
        parent = parents.get(parent)!;
      }
    }
  }
  if (key === 'writing')
    for (const item of value as typeof defaults.writing) {
      if (!['ai', 'upload'].includes(item.coverMode))
        throw new Error('请选择 AI 生成或上传封面');
      if (!item.categoryId) throw new Error('请选择文章分类');
      if (
        !/^\d{4}[.-]\d{2}[.-]\d{2}$/.test(item.date) ||
        new Date(`${item.date.replaceAll('.', '-')}T00:00:00Z`)
          .toISOString()
          .slice(0, 10) !== item.date.replaceAll('.', '-')
      )
        throw new Error('请选择有效的发布日期');
      if (item._published && !item.cover)
        throw new Error('发布文章前请上传或生成文章封面');
    }
}

export function validateProviderUrl(value: string, image = false) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('请输入有效的 API Base URL');
  }
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    (!image && url.search) ||
    url.hash ||
    !url.hostname.includes('.') ||
    /^(\d|\[)/.test(url.hostname) ||
    /\.(localhost|local|internal)$/.test(url.hostname)
  )
    throw new Error('API 和图片地址须使用公开 HTTPS 域名');
  return url;
}

/** Draft records are removed on the server, before public RSC serialization. */
export function publishedOnly(value: unknown): unknown {
  if (Array.isArray(value))
    return value
      .filter(
        (item) =>
          !(item && typeof item === 'object' && item._published === false),
      )
      .map(publishedOnly);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== '_published')
        .map(([key, item]) => [key, publishedOnly(item)]),
    );
  return value;
}
