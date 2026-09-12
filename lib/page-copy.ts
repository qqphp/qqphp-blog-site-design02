import pageCopy from './page-copy.json';

// Migrate saved copy without bringing retired fields back into either API view.
export function migratePageCopy(value: Record<string, Record<string, string>>) {
  const copy = { ...value };
  delete copy['说说封面'];
  for (const page of ['说说页', '项目页', '书签页', '友链页', '书籍页'] as const) {
    const saved = value[page] ?? {};
    copy[page] = Object.fromEntries(
      Object.entries(pageCopy[page]).map(([key, fallback]) => [
        key,
        saved[key] ??
          (key === '08 发布名称' ? saved['08 开发阿雷'] : undefined) ??
          (key === '06 名片数'
            ? saved['06 张名片均为虚构示例，真实友链待补充。']
            : undefined) ??
          fallback,
      ]),
    );
  }
  if (copy['说说页']['03 条说说 ·'] === '条说说 ·')
    copy['说说页']['03 条说说 ·'] = '条说说';
  return copy as typeof pageCopy;
}
