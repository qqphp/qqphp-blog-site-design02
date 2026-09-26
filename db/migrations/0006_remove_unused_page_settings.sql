UPDATE cms_sections
SET value = value - 'aiCover', revision = revision + 1, updated_at = now()
WHERE section = 'pageSettings' AND value ? 'aiCover';

UPDATE cms_sections
SET value = value - 'AI页面' - '投资页', revision = revision + 1, updated_at = now()
WHERE section = 'copy' AND value ?| ARRAY['AI页面', '投资页'];

DELETE FROM cms_section_parts
WHERE (section = 'pageSettings' AND scope = 'aiCover')
   OR (section = 'copy' AND scope IN ('ai', 'investing'));
