import { env } from 'cloudflare:workers';
import { defaults, type PublicContent, type Section } from './cms-defaults';
import { publishedOnly } from './cms-validation';
import { migrateProjects, resolveProjects } from './project-content';
import { categoryId } from './article-categories';
import { migrateStories } from './story-content';

export function bindings() {
  return env as unknown as {
    DB: D1Database;
    MEDIA: R2Bucket;
    ADMIN_PASSWORD?: string;
    TEAMOROUTER_KEY?: string;
    LOCAL_AI_TRANSPORT?: string;
    LOCAL_AI_TOKEN?: string;
  };
}

export async function getDocuments() {
  const { results } = await bindings()
    .DB.prepare('SELECT key, value, revision FROM cms_documents')
    .all<{ key: Section; value: string; revision: number }>();
  const content = structuredClone(defaults);
  const revisions: Partial<Record<Section, number>> = {};
  for (const row of results) {
    if (Object.hasOwn(defaults, row.key)) {
      Object.assign(content, { [row.key]: JSON.parse(row.value) });
      revisions[row.key] = row.revision;
    }
  }
  // Existing saved articles predate category IDs and cover generation settings.
  content.aiSettings = { ...defaults.aiSettings, ...content.aiSettings };
  if (!results.some((row) => row.key === 'categories')) {
    const names = new Set([
      ...content.categories.map((item) => item.name),
      ...content.writing.map((item) => item.category),
    ]);
    content.categories = [...names].filter(Boolean).map((name) => ({
      id: categoryId(name),
      name,
      description: '',
      parentId: '',
    }));
  }
  content.categories = content.categories.map((category) => ({
    ...category,
    parentId: category.parentId ?? '',
  }));
  content.writing = content.writing.map((article) => {
    const id =
      article.categoryId ??
      content.categories.find((item) => item.name === article.category)?.id ??
      categoryId(article.category);
    return {
      ...article,
      categoryId: id,
      category:
        content.categories.find((item) => item.id === id)?.name ??
        article.category,
      coverMode: article.coverMode ?? 'upload',
      coverGeneratedFor: article.coverGeneratedFor ?? '',
    };
  });
  content.projects = Array.isArray(content.projects)
    ? migrateProjects(content.projects)
    : resolveProjects(content.projects);
  content.stories = migrateStories(content.stories);
  return { content, revisions };
}

export async function getPublicContent(): Promise<PublicContent> {
  const { content } = await getDocuments();
  const { aiSettings: _privateSettings, ...publicContent } = content;
  return publishedOnly(publicContent) as PublicContent;
}

export async function saveDocument(
  key: Section,
  value: unknown,
  revision: number,
  guard?: { key: Section; revision: number },
) {
  const db = bindings().DB;
  // A single conditional statement prevents a second editor overwriting newer work.
  const guardSql = guard
    ? ' AND COALESCE((SELECT revision FROM cms_documents WHERE key = ?), 0) = ?'
    : '';
  const guardArgs = guard ? [guard.key, guard.revision] : [];
  const result =
    revision === 0
      ? await db
          .prepare(
            `INSERT INTO cms_documents (key, value, revision) SELECT ?, ?, 1 WHERE 1 = 1${guardSql} ON CONFLICT(key) DO NOTHING`,
          )
          .bind(key, JSON.stringify(value), ...guardArgs)
          .run()
      : await db
          .prepare(
            `UPDATE cms_documents SET value = ?, revision = revision + 1 WHERE key = ? AND revision = ?${guardSql}`,
          )
          .bind(JSON.stringify(value), key, revision, ...guardArgs)
          .run();
  return result.meta.changes > 0;
}
