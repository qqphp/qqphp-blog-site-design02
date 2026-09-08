'use client';
import { useState } from 'react';
import { Tabs } from '@base-ui/react/tabs';
import {
  type Project,
  type ProjectDocument,
  type ProjectOption,
  resolveProjects,
} from '@/lib/project-content';
import { AdminMarkdownEditor } from './admin-markdown-editor';
import { AdminProjectImages } from './admin-project-images';
import { AdminTags } from './admin-tags';

export function AdminProjectManager({
  value,
  onChange,
  onWorking = () => {},
}: {
  value: ProjectDocument;
  onChange: (value: ProjectDocument) => void;
  onWorking?: (busy: boolean) => void;
}) {
  const [editing, setEditing] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const data = resolveProjects(value);
  const current = editing === null ? undefined : data.items[editing];
  const filtered = data.items.filter(
    (item) =>
      (!status || item.statusId === status) &&
      (!category || item.categoryId === category) &&
      `${item.title} ${item.description}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const changeItems = (items: Project[]) => onChange({ ...value, items });
  const edit = (updates: Partial<Project>) =>
    changeItems(
      data.items.map((item, index) =>
        index === editing ? { ...item, ...updates } : item,
      ),
    );
  function add() {
    const item: Project = {
      id: `project-${crypto.randomUUID().slice(0, 8)}`,
      title: '',
      subtitle: '',
      statusId: value.statuses[0]?.id ?? '',
      status: value.statuses[0]?.name ?? '',
      categoryId: value.categories[0]?.id ?? '',
      category: value.categories[0]?.name ?? '',
      year: String(new Date().getFullYear()),
      role: '',
      description: '',
      body: '',
      images: [
        { src: '', label: '', alt: '', mode: 'upload', generatedFor: '' },
      ],
      tags: [],
      _published: false,
    };
    changeItems([...data.items, item]);
    setEditing(data.items.length);
  }
  return (
    <Tabs.Root defaultValue="items" className="admin-project-manager">
      <Tabs.List className="admin-settings-tabs" aria-label="项目管理">
        <Tabs.Tab value="items">
          项目列表 <small>{data.items.length}</small>
        </Tabs.Tab>
        <Tabs.Tab value="statuses">项目状态</Tabs.Tab>
        <Tabs.Tab value="categories">项目分类</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="items">
        {current ? (
          <section className="admin-project-edit">
            <div className="admin-section-heading">
              <button type="button" onClick={() => setEditing(null)}>
                ← 返回项目表格
              </button>
              <span className="admin-help">修改会保留，统一保存栏目后生效</span>
            </div>
            <div className="admin-fields">
              {(
                [
                  ['title', '项目名称'],
                  ['subtitle', '副标题'],
                  ['year', '年份'],
                  ['role', '工作范围'],
                ] as const
              ).map(([key, label]) => (
                <div className="admin-field" key={key}>
                  <label htmlFor={`project-${key}`}>{label}</label>
                  <input
                    id={`project-${key}`}
                    value={current[key]}
                    onChange={(e) => edit({ [key]: e.target.value })}
                  />
                </div>
              ))}
              {(
                [
                  ['statusId', '项目状态', data.statuses],
                  ['categoryId', '项目分类', data.categories],
                ] as const
              ).map(([key, label, options]) => (
                <div className="admin-field" key={key}>
                  <label htmlFor={`project-${key}`}>{label}</label>
                  <select
                    id={`project-${key}`}
                    value={current[key]}
                    onChange={(e) => edit({ [key]: e.target.value })}
                  >
                    <option value="" disabled>
                      请选择{label}
                    </option>
                    {options.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                  {!options.length && (
                    <small>请切换到“{label}”标签新增选项。</small>
                  )}
                </div>
              ))}
              <div className="admin-field admin-wide">
                <label htmlFor="project-summary">摘要</label>
                <textarea
                  id="project-summary"
                  rows={3}
                  value={current.description}
                  onChange={(e) => edit({ description: e.target.value })}
                />
              </div>
              <fieldset className="admin-choice admin-wide">
                <legend>发布状态</legend>
                <label>
                  <input
                    type="radio"
                    name="project-publication"
                    checked={!current._published}
                    onChange={() => edit({ _published: false })}
                  />
                  草稿
                </label>
                <label>
                  <input
                    type="radio"
                    name="project-publication"
                    checked={current._published}
                    onChange={() => edit({ _published: true })}
                  />
                  发布到前台
                </label>
              </fieldset>
              <AdminTags
                value={current.tags}
                onChange={(tags) => edit({ tags })}
              />
              <AdminProjectImages
                project={current}
                onChange={(images) => edit({ images })}
                onWorking={onWorking}
              />
              <AdminMarkdownEditor
                label="项目说明"
                value={current.body}
                onChange={(body) => edit({ body })}
              />
              <details className="admin-article-extra admin-wide">
                <summary>项目标识</summary>
                <div className="admin-field">
                  <label htmlFor="project-id">唯一标识</label>
                  <input
                    id="project-id"
                    value={current.id}
                    onChange={(e) => edit({ id: e.target.value })}
                  />
                  <small>用于项目链接，修改后原链接不再定位到此项目。</small>
                </div>
              </details>
            </div>
          </section>
        ) : (
          <>
            <div className="admin-table-toolbar">
              <input
                type="search"
                aria-label="搜索项目"
                placeholder="搜索项目名称或摘要"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select
                aria-label="筛选项目状态"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">全部项目状态</option>
                {data.statuses.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="筛选项目分类"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">全部项目分类</option>
                {data.categories.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
              <button className="admin-primary" type="button" onClick={add}>
                ＋ 新增项目
              </button>
            </div>
            <div className="admin-table-scroll">
              <table className="admin-project-table">
                <caption>
                  共 {data.items.length} 个项目，当前显示 {filtered.length}{' '}
                  个。所有修改保存栏目后生效。
                </caption>
                <thead>
                  <tr>
                    <th scope="col">项目名称</th>
                    <th scope="col">项目状态</th>
                    <th scope="col">项目分类</th>
                    <th scope="col">发布状态</th>
                    <th scope="col">操作</th>
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
                            onClick={() => setEditing(index)}
                          >
                            {item.title || '未命名项目'}
                          </button>
                          <small>{item.year}</small>
                        </td>
                        <td>{item.status}</td>
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
                              onClick={() => setEditing(index)}
                            >
                              编辑
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                changeItems(
                                  data.items.map((old, i) =>
                                    i === index
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
                                disabled={
                                  index + direction < 0 ||
                                  index + direction >= data.items.length
                                }
                                aria-label={`${direction < 0 ? '上移' : '下移'} ${item.title}`}
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
                                    `删除项目「${item.title}」？保存后生效。`,
                                  )
                                )
                                  changeItems(
                                    data.items.filter((_, i) => i !== index),
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
                    ? '没有符合筛选条件的项目。'
                    : '还没有项目，点击“新增项目”开始。'}
                </p>
              )}
            </div>
          </>
        )}
      </Tabs.Panel>
      <Tabs.Panel value="statuses">
        <ProjectOptions
          label="项目状态"
          options={data.statuses}
          used={(id) =>
            data.items.filter((item) => item.statusId === id).length
          }
          onChange={(statuses) => onChange({ ...value, statuses })}
        />
      </Tabs.Panel>
      <Tabs.Panel value="categories">
        <ProjectOptions
          label="项目分类"
          options={data.categories}
          used={(id) =>
            data.items.filter((item) => item.categoryId === id).length
          }
          onChange={(categories) => onChange({ ...value, categories })}
        />
      </Tabs.Panel>
    </Tabs.Root>
  );
}
function ProjectOptions({
  label,
  options,
  used,
  onChange,
}: {
  label: string;
  options: ProjectOption[];
  used: (id: string) => number;
  onChange: (options: ProjectOption[]) => void;
}) {
  return (
    <section className="admin-project-options">
      <div className="admin-section-heading">
        <div>
          <h2>{label}</h2>
          <p className="admin-help">
            改名会同步关联项目。有项目使用的选项需先解除关联才能删除。
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            onChange([
              ...options,
              { id: `option-${crypto.randomUUID()}`, name: '' },
            ])
          }
        >
          ＋ 新增{label}
        </button>
      </div>
      {options.map((option, index) => (
        <div className="admin-option-row" key={option.id}>
          <label htmlFor={`option-${option.id}`}>
            {label} {index + 1}
          </label>
          <input
            id={`option-${option.id}`}
            value={option.name}
            placeholder={`输入${label}名称`}
            onChange={(e) =>
              onChange(
                options.map((old) =>
                  old.id === option.id ? { ...old, name: e.target.value } : old,
                ),
              )
            }
          />
          <small>{used(option.id)} 个项目</small>
          <button
            type="button"
            className="admin-danger"
            disabled={used(option.id) > 0}
            aria-label={`删除${option.name || label}`}
            onClick={() => {
              if (
                window.confirm(`删除「${option.name || label}」？保存后生效。`)
              )
                onChange(options.filter((old) => old.id !== option.id));
            }}
          >
            删除
          </button>
        </div>
      ))}
      {!options.length && (
        <p className="admin-empty">暂无{label}，可先新增选项。</p>
      )}
    </section>
  );
}
