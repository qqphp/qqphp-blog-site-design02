import { categoryId } from './article-categories';

export type DirectoryItem = {
  id: string;
  name: string;
  url: string;
  description: string;
  categoryId: string;
  category: string;
  tags: string[];
  initials: string;
  _published: boolean;
};
export type DirectoryDocument = {
  items: DirectoryItem[];
  categories: { id: string; name: string }[];
};
type LegacyItem = Pick<DirectoryItem, 'name' | 'category' | 'description'> &
  Partial<DirectoryItem>;

export function migrateDirectory(items: LegacyItem[]): DirectoryDocument {
  const names = [
    ...new Set(items.map((item) => item.category.trim() || '未分类')),
  ];
  return {
    categories: names.map((name) => ({ id: categoryId(name), name })),
    items: items.map((item, index) => ({
      id: item.id ?? `link-${index + 1}`,
      name: item.name,
      url: item.url ?? '',
      description: item.description,
      categoryId: categoryId(item.category.trim() || '未分类'),
      category: item.category.trim() || '未分类',
      tags: item.tags ?? [],
      initials: item.initials ?? '',
      _published: item._published ?? true,
    })),
  };
}

export function resolveDirectory(
  document: DirectoryDocument,
): DirectoryDocument {
  return {
    ...document,
    items: document.items.map((item) => ({
      ...item,
      category:
        document.categories.find((option) => option.id === item.categoryId)
          ?.name ?? item.category,
    })),
  };
}
