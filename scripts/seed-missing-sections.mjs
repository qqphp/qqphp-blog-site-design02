import pg from 'pg';
import { defaults } from '../lib/cms-defaults.ts';
import { adminCollections } from '../lib/admin-sections.ts';
import { ensureManagedPostgres } from './managed-postgres.mjs';

if (!process.env.DATABASE_URL) throw new Error('未配置 DATABASE_URL');
await ensureManagedPostgres();
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
const seeded = [];
try {
  await db.query('BEGIN');
  for (const [section, value] of Object.entries(defaults)) {
    const collections = adminCollections[section] ?? [];
    const metadata = Array.isArray(value) || section === 'writing' || section === 'categories'
      ? {} : Object.fromEntries(Object.entries(value).filter(([key]) => !collections.includes(key)));
    const added = await db.query('INSERT INTO cms_sections (section, value) VALUES ($1, $2::jsonb) ON CONFLICT DO NOTHING RETURNING section',
      [section, JSON.stringify(metadata)]);
    if (!added.rowCount) continue;
    seeded.push(section);
    if (section === 'categories') {
      for (const [position, item] of value.entries())
        await db.query(`INSERT INTO article_categories (id,name,description,parent_id,position)
          VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
        [item.id, item.name, item.description, item.parentId || null, position]);
      continue;
    }
    if (section === 'writing') {
      for (const [position, item] of value.entries())
        await db.query(`INSERT INTO articles (slug,title,excerpt,body,category_id,published_on,
          published,cover_url,cover_mode,cover_generated_for,position)
          VALUES ($1,$2,$3,$4,$5,$6::date,$7,$8,$9,$10,$11) ON CONFLICT DO NOTHING`,
        [item.slug, item.title, item.excerpt, item.body, item.categoryId,
          item.date.replaceAll('.', '-'), item._published, item.cover, item.coverMode,
          item.coverGeneratedFor, position]);
      continue;
    }
    for (const collection of collections) {
      if (section === 'investing') continue;
      const items = collection === 'root' ? value : value[collection];
      if (!Array.isArray(items)) continue;
      for (const [position, item] of items.entries()) {
        const occurred = item.date ?? item.createdAt;
        await db.query(`INSERT INTO cms_entries (section,collection,id,position,published,title,
          category_id,occurred_at,payload,search_text)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10) ON CONFLICT DO NOTHING`,
        [section, collection, item.id ?? `slide-${position}`, position,
          item._published === true, item.title ?? item.name ?? '',
          item.categoryId ?? item.statusId ?? item.moodId ?? null,
          occurred && Number.isFinite(Date.parse(occurred)) ? new Date(occurred) : null,
          JSON.stringify(item), [item.title, item.name, item.description, item.excerpt,
            item.text, item.summary, item.author, item.artist].filter(Boolean).join(' ')]);
      }
    }
    if (section === 'investing') {
      for (const [position, group] of value.sections.entries()) {
        const { entries, ...part } = group;
        await db.query(`INSERT INTO cms_entries (section,collection,id,position,title,payload,search_text)
          VALUES ('investing','sections',$1,$2,$3,$4::jsonb,$5) ON CONFLICT DO NOTHING`,
        [group.id, position, group.title, JSON.stringify(part), `${group.title} ${group.description}`]);
        for (const [entryPosition, item] of entries.entries())
          await db.query(`INSERT INTO cms_entries (section,collection,id,position,published,title,
            category_id,payload,search_text)
            VALUES ('investing','entries',$1,$2,$3,$4,$5,$6::jsonb,$7) ON CONFLICT DO NOTHING`,
          [item.id, entryPosition, item._published, item.title, group.id,
            JSON.stringify(item), `${item.title} ${item.tag} ${item.description}`]);
      }
    }
  }
  await db.query('COMMIT');
  console.log(`已补齐 ${seeded.length} 个此前仅使用默认值的栏目：${seeded.join('、') || '无'}`);
} catch (error) {
  await db.query('ROLLBACK');
  throw error;
} finally {
  await db.end();
}
