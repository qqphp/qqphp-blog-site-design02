import { resolveDirectory } from '@/lib/directory-content';
import {
  authenticated,
  json,
  readLimitedBody,
  sameOrigin,
} from '@/lib/admin-auth';
import { resolveProjects } from '@/lib/project-content';
import { getDocuments, saveDocument } from '@/lib/cms-server';
import { isSection, validateContent } from '@/lib/cms-validation';
import type { Content, Section } from '@/lib/cms-defaults';
import { deletedRecordImageKeys, referencedImageKeys } from '@/lib/cms-media';
import { deleteLocalMedia } from '@/lib/local-media';

export async function GET(request: Request) {
  if (!(await authenticated(request))) return json({ error: '请先登录' }, 401);
  return json(await getDocuments());
}
export async function PUT(request: Request) {
  if (!sameOrigin(request)) return json({ error: '请求来源无效' }, 403);
  if (!(await authenticated(request))) return json({ error: '请先登录' }, 401);
  try {
    const raw = new TextDecoder().decode(
      await readLimitedBody(request, 2000000),
    );
    const { key, value, revision } = JSON.parse(raw);
    if (
      typeof key !== 'string' ||
      !isSection(key) ||
      !Number.isInteger(revision) ||
      revision < 0
    )
      return json({ error: '栏目或版本无效' }, 400);
    validateContent(key, value);
    const current = await getDocuments();
    if (key === 'bookmarks' || key === 'friends')
      Object.assign(value, resolveDirectory(value));
    if (key === 'projects') Object.assign(value, resolveProjects(value));
    let guard: { key: Section; revision: number } | undefined;
    if (key === 'writing' || key === 'categories') {
      const categories: Content['categories'] =
        key === 'categories' ? value : current.content.categories;
      const articles: Content['writing'] =
        key === 'writing' ? value : current.content.writing;
      if (
        articles.some(
          (article) =>
            !categories.some((category) => category.id === article.categoryId),
        )
      )
        return json(
          {
            error:
              key === 'categories'
                ? '该分类仍被文章使用，请先调整相关文章的分类（包括草稿）。'
                : '所选分类已删除，请重新载入并选择分类。',
          },
          400,
        );
      guard = {
        key: key === 'writing' ? 'categories' : 'writing',
        revision:
          current.revisions[key === 'writing' ? 'categories' : 'writing'] ?? 0,
      };
      if (key === 'writing')
        for (const article of articles)
          article.category = categories.find(
            (category) => category.id === article.categoryId,
          )!.name;
    }
    if (!(await saveDocument(key, value, revision, guard)))
      return json(
        {
          error: '此栏目已被另一窗口修改。请备份当前编辑，再重新载入最新内容。',
        },
        409,
      );
    const candidates = deletedRecordImageKeys(key, current.content[key], value);
    const remaining = referencedImageKeys({
      ...current.content,
      [key]: value,
    } as Content);
    const removedMedia: string[] = [];
    const failedMedia: string[] = [];
    for (const mediaKey of candidates) {
      if (remaining.has(mediaKey)) continue;
      try {
        await deleteLocalMedia(mediaKey);
        removedMedia.push(mediaKey);
      } catch {
        failedMedia.push(mediaKey);
      }
    }
    return json({ revision: revision + 1, removedMedia, failedMedia });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : '保存失败' },
      error instanceof RangeError ? 413 : 400,
    );
  }
}
