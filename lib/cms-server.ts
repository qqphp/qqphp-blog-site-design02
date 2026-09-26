import { migrateActivities } from './activity-content';
import { migrateBooks } from './book-content';
import { booklists as defaultBooklists } from './books';
import { migratePodcasts } from './podcast-content';
import { migrateFilms } from './film-content';
import { migrateMusic, publicMusic } from './music-content';
import { migrateDirectory, resolveDirectory } from './directory-content';
import { env } from 'cloudflare:workers';
import { withDatabase } from './postgres';
import { defaults, type PublicContent, type Section } from './cms-defaults';
import { publishedOnly } from './cms-validation';
import { recordTimes } from './content-times';
import { migrateProjects, resolveProjects } from './project-content';
import { categoryId, stripArticleExtras } from './article-categories';
import { migrateStories, newestStoriesFirst } from './story-content';
import { categoryBranch } from './article-categories';
import { monthSummary } from './story-calendar';

export type ArchiveArticle = Pick<typeof defaults.writing[number], 'slug' | 'title' | 'excerpt' | 'categoryId' | 'category' | 'date' | 'cover'>;
export type WritingArchive = {
  items: ArchiveArticle[];
  total: number;
  allCount: number;
  categoryCounts: Record<string, number>;
};
export type StoryArchive = {
  items: typeof defaults.stories;
  total: number;
  yearlyCount: number;
  latestPeriod: number;
  calendar: ReturnType<typeof monthSummary>;
};

export function bindings() {
  return env as unknown as {
    DATABASE_URL?: string;
    ADMIN_PASSWORD?: string;
    TEAMOROUTER_KEY?: string;
    AA_API_KEY?: string;
    LOCAL_AI_TRANSPORT?: string;
    LOCAL_AI_TOKEN?: string;
    LOCAL_MEDIA_STORAGE?: string;
    LOCAL_MEDIA_TOKEN?: string;
  };
}

const entryCollections = {
  projects: ['statuses', 'categories', 'items'],
  stories: ['root'],
  slides: ['root'],
  ai: ['agents', 'skills', 'relays'],
  bookmarks: ['categories', 'items'],
  friends: ['categories', 'items'],
  books: ['categories', 'items', 'lists'],
  tracks: ['scenes', 'items', 'playlists'],
  films: ['categories', 'items'],
  podcasts: ['categories', 'items'],
  travel: ['categories', 'items'],
  hobbies: ['categories', 'items'],
  investing: ['sections', 'entries'],
} as const;

function collectionsFor(key: Section): readonly string[] {
  return Object.hasOwn(entryCollections, key)
    ? entryCollections[key as keyof typeof entryCollections]
    : [];
}

function sectionValue(key: Section, value: unknown) {
  const collections = collectionsFor(key);
  if (!collections.length) return key === 'writing' || key === 'categories' ? {} : value;
  if (Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(([name]) => !collections.includes(name)),
  );
}

function itemRows(key: Section, value: unknown) {
  return collectionsFor(key).flatMap((collection) => {
    const items = collection === 'root' ? value : (value as Record<string, unknown>)[collection];
    if (!Array.isArray(items)) return [];
    return items.map((item: Record<string, unknown>, position) => ({
      section: key,
      collection,
      id: typeof item.id === 'string' ? item.id : `slide-${position}`,
      position,
      published: item._published === true,
      title: typeof item.title === 'string' ? item.title : typeof item.name === 'string' ? item.name : '',
      category_id: typeof item.categoryId === 'string' ? item.categoryId : null,
      occurred_at: typeof item.date === 'string' && Number.isFinite(Date.parse(item.date))
        ? new Date(item.date).toISOString()
        : typeof item.createdAt === 'string' && Number.isFinite(Date.parse(item.createdAt))
          ? new Date(item.createdAt).toISOString()
          : null,
      payload: item,
    }));
  });
}

export async function getDocuments(sections?: Section[]) {
  const { results, categories, articles, entries } = await withDatabase(async (db) => {
    await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    try {
      const selected = sections ?? null;
      const [sectionResult, categories, articles, entries] = await Promise.all([
        db.query<{ section: Section; value: unknown; revision: number }>('SELECT section, value, revision FROM cms_sections WHERE $1::text[] IS NULL OR section = ANY($1::text[])', [selected]),
        db.query<{ id: string; name: string; description: string; parent_id: string | null }>('SELECT id, name, description, parent_id FROM article_categories WHERE $1::boolean ORDER BY position', [!selected || selected.includes('categories')]),
        db.query<{ slug: string; title: string; excerpt: string; body: string; category_id: string; date: string; published: boolean; cover_url: string; cover_mode: string; cover_generated_for: string }>(`SELECT slug, title, excerpt, body, category_id, to_char(published_on, 'YYYY.MM.DD') AS date, published, cover_url, cover_mode, cover_generated_for FROM articles WHERE $1::boolean ORDER BY position`, [!selected || selected.includes('writing')]),
        db.query<{ section: Section; collection: string; category_id: string | null; payload: unknown; createdAt: Date | null; updatedAt: Date }>('SELECT section, collection, category_id, payload, created_at AS "createdAt", updated_at AS "updatedAt" FROM cms_entries WHERE $1::text[] IS NULL OR section = ANY($1::text[]) ORDER BY section, collection, position, id', [selected]),
      ]);
      await db.query('COMMIT');
      return { results: sectionResult.rows, categories: categories.rows, articles: articles.rows, entries: entries.rows };
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  });
  const content = structuredClone(defaults);
  const revisions: Partial<Record<Section, number>> = {};
  for (const row of results) {
    if (Object.hasOwn(defaults, row.section)) {
      Object.assign(content, { [row.section]: row.value });
      revisions[row.section] = row.revision;
    }
  }
  if (revisions.ai === undefined) content.ai = { agents: [], skills: [], relays: [] };
  if (revisions.categories !== undefined)
    content.categories = categories.map((row) => ({ id: row.id, name: row.name, description: row.description, parentId: row.parent_id ?? '' }));
  if (revisions.writing !== undefined)
    content.writing = articles.map((row) => ({
      slug: row.slug, title: row.title, excerpt: row.excerpt, body: row.body,
      categoryId: row.category_id, category: '', date: row.date, _published: row.published,
      cover: row.cover_url, coverMode: row.cover_mode as 'upload' | 'ai', coverGeneratedFor: row.cover_generated_for,
    }));
  for (const key of Object.keys(entryCollections) as Section[]) {
    if (revisions[key] === undefined) continue;
    const collections = collectionsFor(key);
    if (key === 'investing') {
      const sections = entries.filter((row) => row.section === key && row.collection === 'sections');
      const researchEntries = entries.filter((row) => row.section === key && row.collection === 'entries');
      content.investing = {
          ...content.investing,
          sections: sections.map((section) => ({
            ...(section.payload as typeof content.investing.sections[number]),
            entries: researchEntries.filter((entry) =>
              entry.category_id === (section.payload as { id: string }).id,
            ).map((entry) => ({ ...(entry.payload as typeof content.investing.sections[number]['entries'][number]), ...recordTimes(entry) })),
          })),
      };
      continue;
    }
    const grouped = Object.fromEntries(collections.map((collection) => [
      collection, entries.filter((row) => row.section === key && row.collection === collection).map((row) => key === 'projects' && collection === 'items'
        ? { ...(row.payload as object), ...recordTimes(row), createdAt: recordTimes(row).createdAt ?? '' } : row.payload),
    ]));
    Object.assign(content, { [key]: collections.includes('root') ? grouped.root : { ...(content[key] as object), ...grouped } });
  }
  // Existing saved articles predate category IDs and cover generation settings.
  const legacyFilmCoverSettings = !Object.hasOwn(
    content.aiSettings,
    'filmCoverSize',
  );
  content.aiSettings = { ...defaults.aiSettings, ...content.aiSettings };
  if (legacyFilmCoverSettings) {
    if (content.aiSettings.filmCoverPrompt.includes('{{excerpt}}'))
      content.aiSettings.filmCoverPrompt = defaults.aiSettings.filmCoverPrompt;
    for (const field of ['filmCoverStyle', 'filmCoverPrompt'] as const) {
      content.aiSettings[field] = content.aiSettings[field]
        .replaceAll('16:9', '9:16')
        .replaceAll('2:3', '9:16')
        .replaceAll('横向', '竖向')
        .replaceAll('横版', '竖版');
    }
  }
  if (!results.some((row) => row.section === 'categories')) {
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
      ...stripArticleExtras(article),
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
  for (const key of ['bookmarks', 'friends'] as const)
    content[key] = Array.isArray(content[key])
      ? migrateDirectory(content[key])
      : resolveDirectory(content[key]);
  content.stories = migrateStories(content.stories);
  content.tracks = migrateMusic(content.tracks);
  content.travel = migrateActivities(content.travel);
  content.hobbies = migrateActivities(content.hobbies);
  content.books = migrateBooks(content.books, defaultBooklists);
  content.films = migrateFilms(content.films);
  content.podcasts = migratePodcasts(content.podcasts);
  return { content, revisions };
}

export async function getPublicContent(sections?: Section[]): Promise<PublicContent> {
  const { content } = await getDocuments(sections);
  const { aiSettings: _privateSettings, ...publicContent } = content;
  publicContent.tracks = publicMusic(publicContent.tracks);
  const visible = publishedOnly(publicContent) as PublicContent;
  return visible;
}

export async function getPublicArticle(slug: string) {
  const row = await withDatabase(async (db) => {
    const result = await db.query<{ slug: string; title: string; excerpt: string; body: string; categoryId: string; category: string; date: string; cover: string; coverMode: 'upload' | 'ai'; coverGeneratedFor: string }>(
      `SELECT a.slug, a.title, a.excerpt, a.body, a.category_id AS "categoryId",
        c.name AS category, to_char(a.published_on, 'YYYY.MM.DD') AS date,
        a.cover_url AS cover, a.cover_mode AS "coverMode",
        a.cover_generated_for AS "coverGeneratedFor"
       FROM articles a JOIN article_categories c ON c.id = a.category_id
       WHERE a.slug = $1 AND a.published`,
      [slug],
    );
    return result.rows[0] ?? null;
  });
  if (row) return { ...row, _published: true };
  const saved = await withDatabase(async (db) =>
    ((await db.query('SELECT 1 FROM cms_sections WHERE section = $1', ['writing'])).rowCount ?? 0) > 0,
  );
  return saved ? undefined : defaults.writing.find((item) => item.slug === slug && item._published);
}

export async function getRecentArticles(limit: number) {
  const saved = await withDatabase(async (db) => {
    const section = await db.query('SELECT 1 FROM cms_sections WHERE section = $1', ['writing']);
    if (!section.rowCount) return null;
    const result = await db.query<{ slug: string; title: string; excerpt: string; category: string; categoryId: string; date: string; cover: string }>(
      `SELECT a.slug, a.title, a.excerpt, c.name AS category, a.category_id AS "categoryId",
        to_char(a.published_on, 'YYYY.MM.DD') AS date, a.cover_url AS cover
       FROM articles a JOIN article_categories c ON c.id = a.category_id
       WHERE a.published ORDER BY a.published_on DESC, a.slug LIMIT $1`,
      [limit],
    );
    return result.rows;
  });
  return saved ?? [...defaults.writing].filter((item) => item._published)
    .sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}

export async function getRecentProjects(limit: number) {
  const saved = await withDatabase(async (db) => {
    const section = await db.query('SELECT 1 FROM cms_sections WHERE section = $1', ['projects']);
    if (!section.rowCount) return null;
    const result = await db.query<{ payload: typeof defaults.projects.items[number] }>(
      `SELECT payload FROM cms_entries WHERE section = 'projects' AND collection = 'items' AND published
       ORDER BY occurred_at DESC NULLS LAST, position LIMIT $1`,
      [limit],
    );
    return result.rows.map((row) => row.payload);
  });
  return saved ?? [...defaults.projects.items].filter((item) => item._published)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

export async function getWritingArchive(query = '', group = '', page = 1, pageSize = 10): Promise<WritingArchive & { categories: typeof defaults.categories }> {
  const requestedPage = Math.max(1, Math.trunc(page));
  const search = query.trim().toLowerCase();
  const saved = await withDatabase(async (db) => {
    const section = await db.query('SELECT 1 FROM cms_sections WHERE section = $1', ['writing']);
    if (!section.rowCount) return null;
    const categoryRows = await db.query<{ id: string; name: string; description: string; parent_id: string | null }>(
      'SELECT id, name, description, parent_id FROM article_categories ORDER BY position',
    );
    const categories = categoryRows.rows.map((row) => ({ id: row.id, name: row.name, description: row.description, parentId: row.parent_id ?? '' }));
    const branch = group ? [...categoryBranch(categories, group)] : null;
    const matchingCategories = categories.filter((item) => item.name.toLowerCase().includes(search)).map((item) => item.id);
    const pattern = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
    const filter = `a.published AND ($1::text[] IS NULL OR a.category_id = ANY($1::text[]))
      AND ($2 = '' OR (a.title || ' ' || a.excerpt) ILIKE $3 ESCAPE '\\' OR a.category_id = ANY($4::text[]))`;
    const [counts, total, matches, items] = await Promise.all([
      db.query<{ category_id: string; count: number }>('SELECT category_id, count(*)::int AS count FROM articles WHERE published GROUP BY category_id'),
      db.query<{ count: number }>('SELECT count(*)::int AS count FROM articles WHERE published'),
      db.query<{ count: number }>(`SELECT count(*)::int AS count FROM articles a JOIN article_categories c ON c.id = a.category_id WHERE ${filter}`, [branch, search, pattern, matchingCategories]),
      db.query<ArchiveArticle>(`SELECT a.slug, a.title, a.excerpt, a.category_id AS "categoryId",
        c.name AS category, to_char(a.published_on, 'YYYY.MM.DD') AS date, a.cover_url AS cover
        FROM articles a JOIN article_categories c ON c.id = a.category_id WHERE ${filter}
        ORDER BY a.published_on DESC, a.slug LIMIT $5 OFFSET $6`,
      [branch, search, pattern, matchingCategories, pageSize, (requestedPage - 1) * pageSize]),
    ]);
    return {
      categories,
      items: items.rows,
      total: matches.rows[0].count,
      allCount: total.rows[0].count,
      categoryCounts: Object.fromEntries(counts.rows.map((row) => [row.category_id, row.count])),
    };
  });
  if (saved) return saved;
  const categories = defaults.categories;
  const branch = group ? categoryBranch(categories, group) : null;
  const all = defaults.writing.filter((item) => item._published);
  const filtered = all.filter((item) =>
    (!branch || branch.has(item.categoryId)) &&
    `${item.title} ${item.excerpt} ${item.category}`.toLowerCase().includes(search));
  const counts: Record<string, number> = {};
  for (const article of all) counts[article.categoryId] = (counts[article.categoryId] ?? 0) + 1;
  return {
    categories,
    items: filtered.sort((a, b) => b.date.localeCompare(a.date)).slice((requestedPage - 1) * pageSize, requestedPage * pageSize),
    total: filtered.length,
    allCount: all.length,
    categoryCounts: counts,
  };
}

export async function getStoryArchive(page = 1, period?: number): Promise<StoryArchive> {
  const requestedPage = Math.max(1, Math.trunc(page));
  const saved = await withDatabase(async (db) => {
    const section = await db.query('SELECT 1 FROM cms_sections WHERE section = $1', ['stories']);
    if (!section.rowCount) return null;
    const [latest, total, items] = await Promise.all([
      db.query<{ date: Date | null }>(`SELECT max(occurred_at) AS date FROM cms_entries
        WHERE section = 'stories' AND collection = 'root' AND published`),
      db.query<{ count: number }>(`SELECT count(*)::int AS count FROM cms_entries
        WHERE section = 'stories' AND collection = 'root' AND published`),
      db.query<{ payload: typeof defaults.stories[number] }>(`SELECT payload FROM cms_entries
        WHERE section = 'stories' AND collection = 'root' AND published
        ORDER BY occurred_at DESC NULLS LAST, id LIMIT $1 OFFSET $2`,
      [10, (requestedPage - 1) * 10]),
    ]);
    const latestDate = latest.rows[0].date;
    const latestLocal = latestDate ? new Date(latestDate.getTime() + 8 * 3600000) : null;
    const latestPeriod = latestLocal ? latestLocal.getUTCFullYear() * 12 + latestLocal.getUTCMonth() : 2026 * 12 + 8;
    const current = period ?? latestPeriod;
    const year = Math.floor(current / 12);
    const month = current % 12 + 1;
    const shanghaiMidnight = (year: number, zeroBasedMonth: number) =>
      new Date(Date.UTC(year, zeroBasedMonth, 1) - 8 * 3600000).toISOString();
    const yearStart = shanghaiMidnight(year, 0);
    const yearEnd = shanghaiMidnight(year + 1, 0);
    const monthStart = shanghaiMidnight(year, month - 1);
    const monthEnd = shanghaiMidnight(year, month);
    const [yearly, daily] = await Promise.all([
      db.query<{ count: number }>(`SELECT count(*)::int AS count FROM cms_entries
        WHERE section = 'stories' AND collection = 'root' AND published
        AND occurred_at >= $1 AND occurred_at < $2`, [yearStart, yearEnd]),
      db.query<{ day: number; count: number }>(`SELECT EXTRACT(DAY FROM occurred_at AT TIME ZONE 'Asia/Shanghai')::int AS day,
        count(*)::int AS count FROM cms_entries
        WHERE section = 'stories' AND collection = 'root' AND published
        AND occurred_at >= $1 AND occurred_at < $2
        GROUP BY day`, [monthStart, monthEnd]),
    ]);
    const calendar = monthSummary([], year, month);
    const counts = new Map(daily.rows.map((row) => [row.day, row.count]));
    calendar.days = calendar.days.map((day) => ({ ...day, count: counts.get(day.day) ?? 0 }));
    return {
      items: items.rows.map((row) => row.payload), total: total.rows[0].count,
      yearlyCount: yearly.rows[0].count, latestPeriod, calendar,
    };
  });
  if (saved) return saved;
  const stories = newestStoriesFirst(defaults.stories.filter((item) => item._published));
  const latest = stories[0]?.date ?? '2026-09-01';
  const latestPeriod = Number(latest.slice(0, 4)) * 12 + Number(latest.slice(5, 7)) - 1;
  const current = period ?? latestPeriod;
  const year = Math.floor(current / 12);
  const month = current % 12 + 1;
  return {
    items: stories.slice((requestedPage - 1) * 10, requestedPage * 10),
    total: stories.length, yearlyCount: stories.filter((story) => story.date.startsWith(`${year}-`)).length,
    latestPeriod, calendar: monthSummary(stories.map((story) => story.date), year, month),
  };
}

export async function saveDocument(
  key: Section,
  value: unknown,
  revision: number,
  guard?: { key: Section; revision: number },
) {
  return withDatabase(async (db) => {
    await db.query('BEGIN');
    try {
      if (key === 'writing' || key === 'categories')
        await db.query("SELECT pg_advisory_xact_lock(hashtext('cms-writing-categories'))");
      if (guard) {
        const current = await db.query<{ revision: number }>('SELECT revision FROM cms_sections WHERE section = $1', [guard.key]);
        if ((current.rows[0]?.revision ?? 0) !== guard.revision) {
          await db.query('ROLLBACK');
          return false;
        }
      }
      const metadata = JSON.stringify(sectionValue(key, value));
      const saved = revision === 0
        ? await db.query('INSERT INTO cms_sections (section, value) VALUES ($1, $2::jsonb) ON CONFLICT DO NOTHING RETURNING revision', [key, metadata])
        : await db.query('UPDATE cms_sections SET value = $2::jsonb, revision = revision + 1, updated_at = now() WHERE section = $1 AND revision = $3 RETURNING revision', [key, metadata, revision]);
      if (!saved.rowCount) {
        await db.query('ROLLBACK');
        return false;
      }
      if (key === 'categories') {
        const categories = value as typeof defaults.categories;
        const rows = categories.map((item, position) => ({ ...item, position }));
        await db.query('DELETE FROM article_categories WHERE id <> ALL($1::text[])', [rows.map((row) => row.id)]);
        await db.query(`INSERT INTO article_categories (id, name, description, parent_id, position)
          SELECT id, name, description, NULLIF("parentId", ''), position
          FROM jsonb_to_recordset($1::jsonb) AS item(id text, name text, description text, "parentId" text, position integer)
          ON CONFLICT (id) DO UPDATE SET name = excluded.name, description = excluded.description,
            parent_id = excluded.parent_id, position = excluded.position
          WHERE (article_categories.name, article_categories.description, article_categories.parent_id, article_categories.position)
            IS DISTINCT FROM (excluded.name, excluded.description, excluded.parent_id, excluded.position)`, [JSON.stringify(rows)]);
      } else if (key === 'writing') {
        const articles = value as typeof defaults.writing;
        const rows = articles.map((item, position) => ({ ...item, position }));
        if (guard?.revision === 0) {
          for (const [position, category] of defaults.categories.entries())
            await db.query(`INSERT INTO article_categories (id, name, description, parent_id, position)
              VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
            [category.id, category.name, category.description, category.parentId || null, position]);
        }
        await db.query('DELETE FROM articles WHERE slug <> ALL($1::text[])', [rows.map((row) => row.slug)]);
        await db.query(`INSERT INTO articles (slug, title, excerpt, body, category_id, published_on, published, cover_url, cover_mode, cover_generated_for, position)
          SELECT slug, title, excerpt, body, "categoryId", replace(date, '.', '-')::date,
            "_published", cover, "coverMode", "coverGeneratedFor", position
          FROM jsonb_to_recordset($1::jsonb) AS item(slug text, title text, excerpt text, body text,
            "categoryId" text, date text, "_published" boolean, cover text, "coverMode" text,
            "coverGeneratedFor" text, position integer)
          ON CONFLICT (slug) DO UPDATE SET title = excluded.title, excerpt = excluded.excerpt,
            body = excluded.body, category_id = excluded.category_id, published_on = excluded.published_on,
            published = excluded.published, cover_url = excluded.cover_url, cover_mode = excluded.cover_mode,
            cover_generated_for = excluded.cover_generated_for, position = excluded.position, updated_at = now()
          WHERE (articles.title, articles.excerpt, articles.body, articles.category_id, articles.published_on,
            articles.published, articles.cover_url, articles.cover_mode, articles.cover_generated_for, articles.position)
            IS DISTINCT FROM (excluded.title, excluded.excerpt, excluded.body, excluded.category_id,
              excluded.published_on, excluded.published, excluded.cover_url, excluded.cover_mode,
              excluded.cover_generated_for, excluded.position)`, [JSON.stringify(rows)]);
      } else if (collectionsFor(key).length) {
        const rows = itemRows(key, value);
        await db.query('DELETE FROM cms_entries WHERE section = $1 AND (collection, id) NOT IN (SELECT collection, id FROM jsonb_to_recordset($2::jsonb) AS item(collection text, id text))', [key, JSON.stringify(rows)]);
        await db.query(`INSERT INTO cms_entries (section, collection, id, position, published, title, category_id, occurred_at, payload)
          SELECT section, collection, id, position, published, title, category_id, occurred_at, payload
          FROM jsonb_to_recordset($1::jsonb) AS item(section text, collection text, id text,
            position integer, published boolean, title text, category_id text, occurred_at timestamptz, payload jsonb)
          ON CONFLICT (section, collection, id) DO UPDATE SET position = excluded.position,
            published = excluded.published, title = excluded.title, category_id = excluded.category_id,
            occurred_at = excluded.occurred_at, payload = excluded.payload, updated_at = now()
          WHERE cms_entries.position IS DISTINCT FROM excluded.position
            OR cms_entries.payload IS DISTINCT FROM excluded.payload`, [JSON.stringify(rows)]);
      }
      await db.query('COMMIT');
      return true;
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  });
}
