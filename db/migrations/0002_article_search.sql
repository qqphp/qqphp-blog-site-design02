CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS articles_public_search_idx
  ON articles USING gin ((title || ' ' || excerpt) gin_trgm_ops)
  WHERE published;
