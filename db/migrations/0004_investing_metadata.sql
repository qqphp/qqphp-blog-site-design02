UPDATE cms_entries SET payload = payload - 'entries'
WHERE section = 'investing' AND collection = 'sections' AND payload ? 'entries';

UPDATE cms_sections SET value = value - 'sections'
WHERE section = 'investing' AND value ? 'sections';
