-- Run as the blog database owner. Media files remain on disk; URL fields are text.
CREATE TABLE IF NOT EXISTS cms_sections (
  section text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS article_categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  parent_id text REFERENCES article_categories(id) DEFERRABLE INITIALLY DEFERRED,
  position integer NOT NULL CHECK (position >= 0)
);
CREATE INDEX IF NOT EXISTS article_categories_parent_position_idx
  ON article_categories (parent_id, position);

CREATE TABLE IF NOT EXISTS articles (
  slug text PRIMARY KEY,
  title text NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  category_id text NOT NULL REFERENCES article_categories(id) DEFERRABLE INITIALLY DEFERRED,
  published_on date NOT NULL,
  published boolean NOT NULL DEFAULT false,
  cover_url text NOT NULL DEFAULT '',
  cover_mode text NOT NULL DEFAULT 'upload',
  cover_generated_for text NOT NULL DEFAULT '',
  position integer NOT NULL CHECK (position >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS articles_public_date_idx
  ON articles (published_on DESC, slug) WHERE published;
CREATE INDEX IF NOT EXISTS articles_category_public_date_idx
  ON articles (category_id, published_on DESC, slug) WHERE published;
CREATE INDEX IF NOT EXISTS articles_position_idx ON articles (position);

-- Less uniform collections keep their validated item shape in jsonb, alongside
-- typed fields used for common list, filter and detail queries.
CREATE TABLE IF NOT EXISTS cms_entries (
  section text NOT NULL,
  collection text NOT NULL,
  id text NOT NULL,
  position integer NOT NULL CHECK (position >= 0),
  published boolean NOT NULL DEFAULT false,
  title text NOT NULL DEFAULT '',
  category_id text,
  occurred_at timestamptz,
  payload jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (section, collection, id)
);
CREATE INDEX IF NOT EXISTS cms_entries_order_idx
  ON cms_entries (section, collection, position);
CREATE INDEX IF NOT EXISTS cms_entries_public_date_idx
  ON cms_entries (section, collection, occurred_at DESC, id) WHERE published;
CREATE INDEX IF NOT EXISTS cms_entries_category_idx
  ON cms_entries (section, collection, category_id, position);

CREATE TABLE IF NOT EXISTS cms_login_attempts (
  key text PRIMARY KEY,
  count integer NOT NULL CHECK (count >= 0),
  expires bigint NOT NULL
);
CREATE TABLE IF NOT EXISTS aa_language_model_snapshots (
  key text PRIMARY KEY,
  payload jsonb NOT NULL,
  stored_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS api_integration_keys (
  service text PRIMARY KEY,
  api_key text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
