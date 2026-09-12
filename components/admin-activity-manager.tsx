'use client';
import { useState } from 'react';
import { Tabs } from '@base-ui/react/tabs';
import {
  activitySample,
  type Activity,
  type ActivityDocument,
} from '@/lib/activity-content';
import { AdminCollectionCategories } from './admin-collection-categories';
import { AdminCollectionCover } from './admin-collection-cover';
import { AdminTravelAlbum } from './admin-travel-album';
import { AdminTablePagination, pageRows } from './admin-data-table';
import './admin-collections.css';
export function AdminActivityManager({
  section,
  value,
  onChange,
  onWorking,
}: {
  section: 'travel' | 'hobbies';
  value: ActivityDocument;
  onChange: (value: ActivityDocument) => void;
  onWorking: (busy: boolean) => void;
}) {
  const label = section === 'travel' ? '旅行' : '爱好';
  const [draft, setDraft] = useState<Activity | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('items');
  const change = (patch: Partial<Activity>) =>
    setDraft((current) => (current ? { ...current, ...patch } : null));
  const filtered = value.items.filter(
    (item) =>
      (!category || category === item.categoryId) &&
      `${item.title} ${item.description}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const paginated = pageRows(filtered, page);
  return (
    <Tabs.Root
      className="admin-project-manager collection-manager"
      value={tab}
      onValueChange={(next) => {
        if (!busy) setTab(String(next));
      }}
    >
      <Tabs.List className="admin-settings-tabs" aria-label={`${label}管理`}>
        <Tabs.Tab value="items">{label}列表</Tabs.Tab>
        <Tabs.Tab value="categories">{label}分类</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="items">
        {draft ? (
          <fieldset className="collection-editor" disabled={busy}>
            <div className="admin-section-heading">
              <button type="button" onClick={() => setDraft(null)}>
                返回{label}列表
              </button>
              <small>确认后保存栏目；直接返回放弃本次编辑。</small>
            </div>
            <div className="admin-fields">
              <div className="admin-field">
                <label htmlFor="activity-title">{label}标题</label>
                <input
                  id="activity-title"
                  value={draft.title}
                  onChange={(event) => change({ title: event.target.value })}
                />
              </div>
              <div className="admin-field">
                <label htmlFor="activity-category">{label}分类</label>
                <select
                  id="activity-category"
                  value={draft.categoryId}
                  onChange={(event) =>
                    change({ categoryId: event.target.value })
                  }
                >
                  <option value="" disabled>
                    请选择分类
                  </option>
                  {value.categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-field admin-wide">
                <label htmlFor="activity-description">简介</label>
                <textarea
                  id="activity-description"
                  rows={3}
                  value={draft.description}
                  onChange={(event) =>
                    change({ description: event.target.value })
                  }
                />
              </div>
              <div className="admin-field admin-wide">
                <label htmlFor="activity-body">
                  {section === 'travel' ? '旅行记录' : '内容与步骤'}
                </label>
                <textarea
                  id="activity-body"
                  rows={12}
                  value={draft.body}
                  onChange={(event) => change({ body: event.target.value })}
                />
              </div>
              <AdminCollectionCover
                kind={section === 'travel' ? 'travel' : 'hobby'}
                title={draft.title}
                description={draft.description}
                value={draft.cover}
                onChange={(cover) => change({ cover })}
                onWorking={(next) => {
                  setBusy(next);
                  onWorking(next);
                }}
              />
              {section === 'travel' && (
                <AdminTravelAlbum
                  value={draft.album}
                  onChange={(album) => change({ album })}
                  onWorking={(next) => {
                    setBusy(next);
                    onWorking(next);
                  }}
                />
              )}
              <label className="admin-choice">
                <input
                  type="checkbox"
                  checked={draft._published}
                  onChange={(event) =>
                    change({ _published: event.target.checked })
                  }
                />
                发布到前台
              </label>
            </div>
            <div className="admin-music-actions">
              <button
                type="button"
                className="admin-primary"
                disabled={
                  !draft.title.trim() ||
                  !value.categories.some((item) => item.id === draft.categoryId)
                }
                onClick={() => {
                  onChange({
                    ...value,
                    items: value.items.some((item) => item.id === draft.id)
                      ? value.items.map((item) =>
                          item.id === draft.id ? draft : item,
                        )
                      : [...value.items, draft],
                  });
                  setDraft(null);
                }}
              >
                确认
                {value.items.some((item) => item.id === draft.id)
                  ? '修改'
                  : '添加'}
              </button>
            </div>
          </fieldset>
        ) : (
          <>
            <div className="admin-table-toolbar">
              <input
                type="search"
                aria-label={`搜索${label}`}
                placeholder="搜索标题或简介"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
              />
              <select
                aria-label={`筛选${label}分类`}
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">全部分类</option>
                {value.categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="admin-primary"
                onClick={() =>
                  setDraft({
                    ...activitySample.items[0],
                    title: '',
                    id: crypto.randomUUID(),
                    categoryId: value.categories[0]?.id ?? '',
                  })
                }
              >
                新增{label}
              </button>
            </div>
            <div className="admin-table-scroll">
              <table className="admin-data-table">
                <caption>{filtered.length} 项，保存栏目后生效</caption>
                <thead>
                  <tr>
                    {['标题', '分类', '简介', '状态', '操作'].map((name) => (
                      <th key={name} scope="col">
                        {name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.rows.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <button
                            type="button"
                            className="admin-table-title"
                            onClick={() => setDraft({ ...item })}
                          >
                            {item.title}
                          </button>
                        </td>
                        <td>
                          {
                            value.categories.find(
                              (category) => category.id === item.categoryId,
                            )?.name
                          }
                        </td>
                        <td>
                          <span className="collection-table-summary">
                            {item.description || '—'}
                          </span>
                        </td>
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
                              onClick={() => setDraft({ ...item })}
                            >
                              编辑
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onChange({
                                  ...value,
                                  items: value.items.map((entry) =>
                                    entry.id === item.id
                                      ? {
                                          ...entry,
                                          _published: !entry._published,
                                        }
                                      : entry,
                                  ),
                                })
                              }
                            >
                              {item._published ? '转草稿' : '发布'}
                            </button>
                            {[-1, 1].map((direction) => (
                              <button
                                type="button"
                                key={direction}
                                aria-label={`${direction < 0 ? '上移' : '下移'} ${item.title}`}
                                disabled={
                                  value.items.indexOf(item) + direction < 0 ||
                                  value.items.indexOf(item) + direction >=
                                    value.items.length
                                }
                                onClick={() => {
                                  const items = [...value.items];
                                  const index = items.indexOf(item);
                                  [items[index], items[index + direction]] = [
                                    items[index + direction],
                                    items[index],
                                  ];
                                  onChange({ ...value, items });
                                }}
                              >
                                {direction < 0 ? '↑' : '↓'}
                              </button>
                            ))}
                            <button
                              type="button"
                              className="admin-danger"
                              onClick={() => {
                                if (window.confirm(`删除「${item.title}」？`))
                                  onChange({
                                    ...value,
                                    items: value.items.filter(
                                      (entry) => entry.id !== item.id,
                                    ),
                                  });
                              }}
                            >
                              删除
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {!filtered.length && (
                <p className="admin-empty">暂无匹配内容。</p>
              )}
            </div>
            <AdminTablePagination
              page={paginated.current}
              total={filtered.length}
              onChange={setPage}
            />
          </>
        )}
      </Tabs.Panel>
      <Tabs.Panel value="categories">
        <AdminCollectionCategories
          label={label}
          categories={value.categories}
          items={value.items}
          onChange={(categories) => {
            onChange({ ...value, categories });
            setCategory('');
          }}
        />
      </Tabs.Panel>
    </Tabs.Root>
  );
}
