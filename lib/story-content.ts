export type Story = {
  id: string;
  date: string;
  text: string;
  topics: string[];
  images: { src: string; alt: string }[];
  _published: boolean;
};

export function storyDate(date: Date) {
  return (
    new Date(date.getTime() + 8 * 3600000).toISOString().slice(0, 19) + '+08:00'
  );
}

export function normalizeStoryTopics(topics: string[]) {
  return [
    ...new Set(
      topics
        .map((topic) => topic.replace(/^[\s#＃]+/u, '').trim())
        .filter(Boolean),
    ),
  ];
}

export function newestStoriesFirst(stories: Story[]) {
  return [...stories].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

// Keep existing content and stable IDs when upgrading old documents.
export function migrateStories(
  items: (Partial<Story> & { topic?: string })[],
): Story[] {
  return items.map((item, index) => ({
    id: item.id ?? `story-${index + 1}`,
    date:
      item.date && Number.isFinite(Date.parse(item.date))
        ? storyDate(new Date(item.date))
        : (item.date ?? ''),
    text: item.text ?? '',
    topics: normalizeStoryTopics(
      item.topics ?? (item.topic ? [item.topic] : []),
    ),
    images: item.images ?? [],
    _published: item._published ?? true,
  }));
}
