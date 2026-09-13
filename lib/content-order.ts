function timestamp(value: string) {
  return Date.parse(value) || 0;
}

export function newestArticlesFirst<T extends { date: string }>(items: T[]) {
  return [...items].sort(
    (a, b) =>
      timestamp(b.date.replaceAll('.', '-')) -
      timestamp(a.date.replaceAll('.', '-')),
  );
}

export function newestProjectsFirst<
  T extends { createdAt: string; year: string },
>(items: T[]) {
  const projectTimestamp = (item: T) => {
    const legacyYear = item.year.match(/\d{4}/)?.[0];
    return (
      timestamp(item.createdAt) ||
      (legacyYear ? timestamp(`${legacyYear}-01-01`) : 0)
    );
  };
  return [...items].sort((a, b) => projectTimestamp(b) - projectTimestamp(a));
}
