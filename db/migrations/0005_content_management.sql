-- Unknown historical creation times remain null. Defaults apply only to new rows.
ALTER TABLE articles ADD COLUMN created_at timestamptz;
ALTER TABLE articles ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE cms_entries ADD COLUMN created_at timestamptz;
ALTER TABLE cms_entries ALTER COLUMN created_at SET DEFAULT now();

UPDATE cms_entries SET created_at = (payload->>'createdAt')::timestamptz
WHERE section = 'projects' AND collection = 'items'
  AND coalesce(payload->>'createdAt', '') <> ''
  AND pg_input_is_valid(payload->>'createdAt', 'timestamp with time zone');

UPDATE cms_entries AS entry SET
  title = names.new_title,
  payload = jsonb_set(entry.payload, '{title}', to_jsonb(names.new_title)),
  search_text = replace(entry.search_text, names.old_title, names.new_title),
  revision = entry.revision + 1
FROM (VALUES ('trends', '趋势分析', '技术分析'), ('indicators', '策略指标', '技术指标'))
  AS names(id, old_title, new_title)
WHERE entry.section = 'investing' AND entry.collection = 'sections'
  AND entry.id = names.id AND entry.title = names.old_title
  AND entry.payload->>'title' = names.old_title;

CREATE INDEX cms_entries_creation_idx ON cms_entries
  (section, collection, created_at DESC NULLS LAST, position, id);
