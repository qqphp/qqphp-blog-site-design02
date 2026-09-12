'use client';
export function AdminCollectionCategories({
  label,
  categories,
  items,
  onChange,
}: {
  label: string;
  categories: { id: string; name: string }[];
  items: { categoryId: string }[];
  onChange: (categories: { id: string; name: string }[]) => void;
}) {
  return (
    <section>
      <div className="admin-section-heading">
        <div>
          <h2>{label}分类</h2>
          <p className="admin-help">
            改名同步前台。有关联内容（含草稿）的分类不能删除。
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            onChange([...categories, { id: crypto.randomUUID(), name: '' }])
          }
        >
          新增{label}分类
        </button>
      </div>
      {categories.map((category, index) => (
        <div className="admin-option-row" key={category.id}>
          <label htmlFor={`collection-category-${category.id}`}>
            {label}分类 {index + 1}
          </label>
          <input
            id={`collection-category-${category.id}`}
            value={category.name}
            onChange={(event) =>
              onChange(
                categories.map((item) =>
                  item.id === category.id
                    ? { ...item, name: event.target.value }
                    : item,
                ),
              )
            }
          />
          <small>
            {items.filter((item) => item.categoryId === category.id).length} 项
          </small>
          <button
            type="button"
            disabled={items.some((item) => item.categoryId === category.id)}
            aria-label={`删除分类 ${category.name}`}
            onClick={() => {
              if (window.confirm(`删除分类「${category.name}」？`))
                onChange(categories.filter((item) => item.id !== category.id));
            }}
          >
            删除
          </button>
        </div>
      ))}
    </section>
  );
}
