'use client';
import { useState } from 'react';
import type { Content } from '@/lib/cms-defaults';
import { categoryBranch, categoryRows } from '@/lib/article-categories';

type Category = Content['categories'][number];
export function AdminCategoryManager({
  categories,
  articles,
  onChange,
}: {
  categories: Category[];
  articles: Content['writing'];
  onChange: (value: Category[]) => void;
}) {
  const [selected, setSelected] = useState(categories[0]?.id ?? '');
  const [collapsed, setCollapsed] = useState(new Set<string>());
  const current = categories.find((item) => item.id === selected);
  const rows = categoryRows(categories);
  const excluded = categoryBranch(categories, selected);
  function add(parentId: string) {
    const id = `category-${crypto.randomUUID()}`;
    onChange([...categories, { id, parentId, name: '', description: '' }]);
    setSelected(id);
    setCollapsed(new Set());
  }
  function change(update: Partial<Category>) {
    onChange(
      categories.map((item) =>
        item.id === selected ? { ...item, ...update } : item,
      ),
    );
  }
  const used = articles.filter(
    (article) => article.categoryId === selected,
  ).length;
  const children = categories.filter(
    (item) => item.parentId === selected,
  ).length;
  const siblings = categories.filter(
    (item) => item.parentId === current?.parentId,
  );
  const position = siblings.findIndex((item) => item.id === selected);
  function move(direction: number) {
    const other = siblings[position + direction];
    if (!other) return;
    const items = [...categories];
    const first = items.findIndex((item) => item.id === selected);
    const second = items.findIndex((item) => item.id === other.id);
    [items[first], items[second]] = [items[second], items[first]];
    onChange(items);
  }
  const hidden = new Set<string>();
  for (const id of collapsed)
    for (const child of categoryBranch(categories, id))
      if (child !== id) hidden.add(child);
  return (
    <div className="admin-category-manager">
      <aside className="admin-category-tree">
        <div className="admin-section-heading">
          <strong>
            分类目录 <small>{categories.length}</small>
          </strong>
          <button type="button" onClick={() => add('')}>
            ＋ 顶级分类
          </button>
        </div>
        <ul aria-label="文章分类层级">
          {rows
            .filter((row) => !hidden.has(row.category.id))
            .map(({ category, depth }) => (
              <li key={category.id} style={{ paddingInlineStart: depth * 18 }}>
                {categories.some((item) => item.parentId === category.id) ? (
                  <button
                    className="admin-tree-toggle"
                    type="button"
                    aria-label={`${collapsed.has(category.id) ? '展开' : '收起'} ${category.name || '未命名分类'}`}
                    aria-expanded={!collapsed.has(category.id)}
                    onClick={() => {
                      const next = new Set(collapsed);
                      if (next.has(category.id)) next.delete(category.id);
                      else next.add(category.id);
                      setCollapsed(next);
                    }}
                  >
                    {collapsed.has(category.id) ? '▸' : '▾'}
                  </button>
                ) : (
                  <span className="admin-tree-leaf" aria-hidden="true">
                    ·
                  </span>
                )}
                <button
                  className="admin-tree-name"
                  type="button"
                  aria-current={selected === category.id ? 'true' : undefined}
                  onClick={() => setSelected(category.id)}
                >
                  <span>{category.name || '未命名分类'}</span>
                  <small>
                    {
                      articles.filter(
                        (article) => article.categoryId === category.id,
                      ).length
                    }
                  </small>
                </button>
              </li>
            ))}
        </ul>
        {!categories.length && (
          <p className="admin-empty">还没有分类，从顶级分类开始。</p>
        )}
      </aside>
      <section className="admin-category-form">
        {current ? (
          <>
            <div className="admin-section-heading">
              <div>
                <small>
                  {rows.find((row) => row.category.id === selected)?.path ||
                    '新分类'}
                </small>
                <h2>编辑分类</h2>
              </div>
              <button type="button" onClick={() => add(selected)}>
                ＋ 子分类
              </button>
            </div>
            <div className="admin-fields">
              <div className="admin-field">
                <label htmlFor="category-name">分类名称</label>
                <input
                  id="category-name"
                  value={current.name}
                  placeholder="例如：前端开发"
                  onChange={(e) => change({ name: e.target.value })}
                />
              </div>
              <div className="admin-field">
                <label htmlFor="category-parent">上级分类</label>
                <select
                  id="category-parent"
                  value={current.parentId}
                  onChange={(e) => change({ parentId: e.target.value })}
                >
                  <option value="">无上级 · 顶级分类</option>
                  {rows
                    .filter((row) => !excluded.has(row.category.id))
                    .map((row) => (
                      <option key={row.category.id} value={row.category.id}>
                        {row.path}
                      </option>
                    ))}
                </select>
              </div>
              <div className="admin-field admin-wide">
                <label htmlFor="category-description">分类说明</label>
                <textarea
                  id="category-description"
                  rows={4}
                  value={current.description}
                  onChange={(e) => change({ description: e.target.value })}
                />
              </div>
            </div>
            <div className="admin-category-footer">
              <span>
                {used} 篇文章 · {children} 个直接子分类
              </span>
              <div>
                <button
                  type="button"
                  disabled={position <= 0}
                  onClick={() => move(-1)}
                >
                  同级上移
                </button>
                <button
                  type="button"
                  disabled={position >= siblings.length - 1}
                  onClick={() => move(1)}
                >
                  同级下移
                </button>
                <button
                  className="admin-danger"
                  type="button"
                  disabled={Boolean(used || children)}
                  onClick={() => {
                    if (
                      window.confirm(
                        `删除分类「${current.name || '未命名分类'}」？保存后生效。`,
                      )
                    ) {
                      onChange(
                        categories.filter((item) => item.id !== selected),
                      );
                      setSelected('');
                    }
                  }}
                >
                  删除分类
                </button>
              </div>
            </div>
            <p className="admin-help">
              调整上级会同时移动整个分支。删除前需移走子分类与关联文章（含草稿）。修改统一点击“保存栏目”。
            </p>
          </>
        ) : (
          <p className="admin-empty">选择分类进行编辑，或新增顶级分类。</p>
        )}
      </section>
    </div>
  );
}
