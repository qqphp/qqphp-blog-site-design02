'use client';
import { useState } from 'react';
import { Tabs } from '@base-ui/react/tabs';
import {
  resolveDirectory,
  type DirectoryDocument,
  type DirectoryItem,
} from '@/lib/directory-content';
import { AdminTags } from './admin-tags';

export function AdminDirectoryManager({
  section,
  value,
  onChange,
}: {
  section: 'bookmarks' | 'friends';
  value: DirectoryDocument;
  onChange: (value: DirectoryDocument) => void;
}) {
  const label = section === 'bookmarks' ? '书签' : '友链';
  const [editing, setEditing] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const data = resolveDirectory(value);
  const current = data.items.find((item) => item.id === editing);
  const change = (next: DirectoryDocument) => onChange(resolveDirectory(next));
  const changeItems = (items: DirectoryItem[]) => change({ ...data, items });
  const edit = (updates: Partial<DirectoryItem>) =>
    changeItems(
      data.items.map((item) =>
        item.id === editing ? { ...item, ...updates } : item,
      ),
    );
  const filtered = data.items.filter(
    (item) =>
      (!category || item.categoryId === category) &&
      [item.name, item.url, item.description, item.category, ...item.tags]
        .join(' ')
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  return (
    <Tabs.Root defaultValue="items" className="admin-project-manager">
      <Tabs.List className="admin-settings-tabs" aria-label={`${label}管理`}>
        <Tabs.Tab value="items">
          {label}列表 <small>{data.items.length}</small>
        </Tabs.Tab>
        <Tabs.Tab value="categories">{label}分类</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="items">
        {current ? (
          <section className="admin-project-edit">
            <div className="admin-section-heading">
              <button type="button" onClick={() => setEditing(null)}>
                ← 返回{label}表格
              </button>
              <span className="admin-help">修改会保留，统一保存栏目后生效</span>
            </div>
            <div className="admin-fields">
              {(
                [
                  ['name', `${label}名称`],
                  ['url', '网站地址'],
                ] as const
              ).map(([key, title]) => (
                <div className="admin-field" key={key}>
                  <label htmlFor={`directory-${key}`}>{title}</label>
                  <input
                    id={`directory-${key}`}
                    value={current[key]}
                    onChange={(e) => edit({ [key]: e.target.value })}
                  />
                </div>
              ))}
              <div className="admin-field">
                <label htmlFor="directory-category">{label}分类</label>
                <select
                  id="directory-category"
                  value={current.categoryId}
                  onChange={(e) => edit({ categoryId: e.target.value })}
                >
                  <option value="" disabled>
                    请选择{label}分类
                  </option>
                  {data.categories.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
                {!data.categories.length && (
                  <small>请切换到“{label}分类”新增分类。</small>
                )}
              </div>
              {section === 'friends' && (
                <div className="admin-field">
                  <label htmlFor="directory-initials">头像文字</label>
                  <input
                    id="directory-initials"
                    value={current.initials}
                    onChange={(e) => edit({ initials: e.target.value })}
                  />
                </div>
              )}
              <div className="admin-field admin-wide">
                <label htmlFor="directory-description">简介</label>
                <textarea
                  id="directory-description"
                  rows={3}
                  value={current.description}
                  onChange={(e) => edit({ description: e.target.value })}
                />
              </div>
              {section === 'bookmarks' && (
                <AdminTags
                  value={current.tags}
                  onChange={(tags) => edit({ tags })}
                />
              )}
              <fieldset className="admin-choice admin-wide">
                <legend>发布状态</legend>
                <label>
                  <input
                    type="radio"
                    name="directory-publication"
                    checked={!current._published}
                    onChange={() => edit({ _published: false })}
                  />
                  草稿
                </label>
                <label>
                  <input
                    type="radio"
                    name="directory-publication"
                    checked={current._published}
                    onChange={() => edit({ _published: true })}
                  />
                  发布到前台
                </label>
              </fieldset>
            </div>
          </section>
        ) : (
          <>
            <div className="admin-table-toolbar">
              <input
                type="search"
                aria-label={`搜索${label}`}
                placeholder="搜索名称、网址或简介"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select
                aria-label={`筛选${label}分类`}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">全部{label}分类</option>
                {data.categories.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="admin-primary"
                onClick={() => {
                  const item: DirectoryItem = {
                    id: `link-${crypto.randomUUID()}`,
                    name: '',
                    url: '',
                    description: '',
                    categoryId: data.categories[0]?.id ?? '',
                    category: '',
                    tags: [],
                    initials: '',
                    _published: false,
                  };
                  changeItems([...data.items, item]);
                  setEditing(item.id);
                }}
              >
                ＋ 新增{label}
              </button>
            </div>
            <div className="admin-table-scroll">
              <table className="admin-project-table">
                <caption>
                  共 {data.items.length} 个{label}，当前显示 {filtered.length}{' '}
                  个。所有修改保存栏目后生效。
                </caption>
                <thead>
                  <tr>
                    {[
                      `${label}名称`,
                      '网站地址',
                      `${label}分类`,
                      '发布状态',
                      '操作',
                    ].map((title) => (
                      <th scope="col" key={title}>
                        {title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const index = data.items.indexOf(item);
                    return (
                      <tr key={item.id}>
                        <td>
                          <button
                            type="button"
                            className="admin-table-title"
                            onClick={() => setEditing(item.id)}
                          >
                            {item.name || `未命名${label}`}
                          </button>
                          <small>{item.description}</small>
                        </td>
                        <td>{item.url || '待补充'}</td>
                        <td>{item.category}</td>
                        <td>
                          <span
                            className={`admin-status-badge ${item._published ? 'published' : ''}`}
                          >
                            {item._published ? '已发布' : '草稿'}
                          </span>
                        </td>
                        <td>
                          <div className="admin-row-actions">
                            <button
                              type="button"
                              onClick={() => setEditing(item.id)}
                            >
                              编辑
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                changeItems(
                                  data.items.map((old) =>
                                    old.id === item.id
                                      ? { ...old, _published: !old._published }
                                      : old,
                                  ),
                                )
                              }
                            >
                              {item._published ? '转草稿' : '发布'}
                            </button>
                            {[-1, 1].map((direction) => (
                              <button
                                type="button"
                                key={direction}
                                aria-label={`${direction < 0 ? '上移' : '下移'} ${item.name}`}
                                disabled={
                                  index + direction < 0 ||
                                  index + direction >= data.items.length
                                }
                                onClick={() => {
                                  const items = [...data.items];
                                  [items[index], items[index + direction]] = [
                                    items[index + direction],
                                    items[index],
                                  ];
                                  changeItems(items);
                                }}
                              >
                                {direction < 0 ? '↑' : '↓'}
                              </button>
                            ))}
                            <button
                              type="button"
                              className="admin-danger"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `删除${label}「${item.name}」？保存后生效。`,
                                  )
                                )
                                  changeItems(
                                    data.items.filter(
                                      (old) => old.id !== item.id,
                                    ),
                                  );
                              }}
                            >
                              删除
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!filtered.length && (
                <p className="admin-empty">
                  {data.items.length
                    ? '没有符合筛选条件的条目。'
                    : `还没有${label}，点击“新增${label}”开始。`}
                </p>
              )}
            </div>
          </>
        )}
      </Tabs.Panel>
      <Tabs.Panel value="categories">
        <section className="admin-project-options">
          <div className="admin-section-heading">
            <div>
              <h2>{label}分类</h2>
              <p className="admin-help">
                改名会同步关联{label}
                。删除前需移走关联条目（含草稿）。修改统一保存栏目后生效。
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                change({
                  ...data,
                  categories: [
                    ...data.categories,
                    { id: `category-${crypto.randomUUID()}`, name: '' },
                  ],
                })
              }
            >
              ＋ 新增{label}分类
            </button>
          </div>
          {data.categories.map((option, index) => {
            const used = data.items.filter(
              (item) => item.categoryId === option.id,
            ).length;
            return (
              <div className="admin-option-row" key={option.id}>
                <label htmlFor={`directory-option-${option.id}`}>
                  {label}分类 {index + 1}
                </label>
                <input
                  id={`directory-option-${option.id}`}
                  value={option.name}
                  placeholder={`输入${label}分类名称`}
                  onChange={(e) =>
                    change({
                      ...data,
                      categories: data.categories.map((old) =>
                        old.id === option.id
                          ? { ...old, name: e.target.value }
                          : old,
                      ),
                    })
                  }
                />
                <small>
                  {used} 个{label}
                </small>
                <button
                  type="button"
                  className="admin-danger"
                  disabled={used > 0}
                  aria-label={`删除${option.name || `${label}分类`}`}
                  onClick={() => {
                    if (
                      window.confirm(
                        `删除「${option.name || `${label}分类`}」？保存后生效。`,
                      )
                    ) {
                      change({
                        ...data,
                        categories: data.categories.filter(
                          (old) => old.id !== option.id,
                        ),
                      });
                      if (category === option.id) setCategory('');
                    }
                  }}
                >
                  删除
                </button>
              </div>
            );
          })}
          {!data.categories.length && (
            <p className="admin-empty">暂无{label}分类，可先新增分类。</p>
          )}
        </section>
      </Tabs.Panel>
    </Tabs.Root>
  );
}
