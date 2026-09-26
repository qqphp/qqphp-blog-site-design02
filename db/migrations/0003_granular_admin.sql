ALTER TABLE articles ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 1;
ALTER TABLE article_categories ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 1;
ALTER TABLE cms_entries ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 1;
ALTER TABLE cms_entries ADD COLUMN IF NOT EXISTS search_text text NOT NULL DEFAULT '';

UPDATE cms_entries
SET search_text = concat_ws(' ', title, payload->>'description', payload->>'excerpt',
  payload->>'text', payload->>'summary', payload->>'author', payload->>'artist')
WHERE search_text = '';
CREATE INDEX IF NOT EXISTS cms_entries_admin_order_idx
  ON cms_entries (section, collection, position, id);
CREATE INDEX IF NOT EXISTS cms_entries_admin_date_idx
  ON cms_entries (section, collection, occurred_at DESC, id);
CREATE INDEX IF NOT EXISTS cms_entries_admin_search_idx
  ON cms_entries USING gin (search_text gin_trgm_ops);
CREATE INDEX IF NOT EXISTS articles_admin_date_idx
  ON articles (published_on DESC, slug);
CREATE INDEX IF NOT EXISTS articles_admin_search_idx
  ON articles USING gin ((title || ' ' || excerpt) gin_trgm_ops);

CREATE TABLE IF NOT EXISTS cms_section_parts (
  section text NOT NULL,
  scope text NOT NULL,
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  PRIMARY KEY (section, scope)
);
UPDATE cms_entries
SET payload = jsonb_set(payload, '{id}', to_jsonb(id))
WHERE section = 'slides' AND collection = 'root' AND NOT (payload ? 'id');

INSERT INTO cms_entries (section, collection, id, position, title, payload, search_text)
SELECT 'investing', 'sections', item->>'id', ordinality::integer - 1,
  item->>'title', item - 'entries', concat_ws(' ', item->>'title', item->>'description')
FROM cms_sections s,
  jsonb_array_elements(s.value->'sections') WITH ORDINALITY AS rows(item, ordinality)
WHERE s.section = 'investing'
ON CONFLICT DO NOTHING;

INSERT INTO cms_entries (section, collection, id, position, published, title, category_id, payload, search_text)
SELECT 'investing', 'entries', (section_item->>'id') || '-' || entry_ordinality,
  entry_ordinality::integer - 1, COALESCE((entry_item->>'_published')::boolean, true),
  entry_item->>'title', section_item->>'id',
  entry_item || jsonb_build_object('id', (section_item->>'id') || '-' || entry_ordinality),
  concat_ws(' ', entry_item->>'title', entry_item->>'tag', entry_item->>'description')
FROM cms_sections s,
  jsonb_array_elements(s.value->'sections') AS sections(section_item),
  jsonb_array_elements(section_item->'entries') WITH ORDINALITY AS entries(entry_item, entry_ordinality)
WHERE s.section = 'investing'
ON CONFLICT DO NOTHING;
