export function categoryId(name: string) {
  return `category-${Array.from(name)
    .map((char) => char.codePointAt(0)!.toString(16))
    .join('-')}`;
}

export function coverInput(title: string, excerpt: string) {
  return JSON.stringify([title.trim(), excerpt.trim()]);
}

export type CategoryNode = { id: string; name: string; parentId: string };
export function categoryRows<T extends CategoryNode>(categories: T[]) {
  const rows: { category: T; depth: number; path: string }[] = [];
  const seen = new Set<string>();
  function visit(parentId: string, depth: number, path: string) {
    for (const category of categories.filter(
      (item) => item.parentId === parentId,
    )) {
      if (seen.has(category.id)) continue;
      seen.add(category.id);
      const nextPath = path ? `${path} / ${category.name}` : category.name;
      rows.push({ category, depth, path: nextPath });
      visit(category.id, depth + 1, nextPath);
    }
  }
  visit('', 0, '');
  return rows;
}

export function categoryBranch(
  categories: CategoryNode[],
  id: string,
): Set<string> {
  const ids = new Set([id]);
  for (let size = -1; size !== ids.size;) {
    size = ids.size;
    for (const category of categories)
      if (ids.has(category.parentId)) ids.add(category.id);
  }
  return ids;
}
