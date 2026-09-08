import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const documents = sqliteTable('cms_documents', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  revision: integer('revision').notNull().default(1),
});

export const loginAttempts = sqliteTable('cms_login_attempts', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  expires: integer('expires').notNull(),
});

export const storyComments = sqliteTable(
  'story_comments',
  {
    id: text('id').primaryKey(),
    storyId: text('story_id').notNull(),
    parentId: text('parent_id'),
    author: text('author').notNull(),
    body: text('body').notNull(),
    createdAt: text('created_at').notNull(),
    isAdmin: integer('is_admin').notNull().default(0),
  },
  (table) => [
    index('idx_story_comments_story_date').on(table.storyId, table.createdAt),
  ],
);
