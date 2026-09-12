'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Tabs } from '@base-ui/react/tabs';
import { type Film, type FilmDocument, filmSample } from '@/lib/film-content';
import { api, upload } from './admin-fields';
import { AdminTablePagination, pageRows } from './admin-data-table';

export async function createFilmCover(film: Film): Promise<Film> {
  const result = await api<{ url: string; generatedFor: string }>(
    '/api/admin/ai',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'film-cover',
        title: film.title,
        director: film.director,
      }),
    },
  );
  return { ...film, cover: result.url, coverGeneratedFor: result.generatedFor };
}
export function AdminFilmManager({
  value,
  onChange,
  onWorking,
}: {
  value: FilmDocument;
  onChange: (value: FilmDocument) => void;
  onWorking: (busy: boolean) => void;
}) {
  const [tab, setTab] = useState('films');
  const [draft, setDraft] = useState<Film | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const change = (patch: Partial<Film>) =>
    setDraft((current) => (current ? { ...current, ...patch } : current));
  const filtered = value.items.filter(
    (item) =>
      (!category || item.categoryId === category) &&
      [item.title, item.director, item.genre, item.country, item.language]
        .join(' ')
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const paginated = pageRows(filtered, page);
  function working(next: boolean) {
    setBusy(next);
    onWorking(next);
  }
  async function generate() {
    if (!draft) return;
    working(true);
    setMessage('正在生成电影封面，可能需要几分钟…');
    try {
      setDraft(await createFilmCover(draft));
      setMessage('封面已生成，确认电影后保存栏目。');
    } catch (error) {
      setMessage(String(error));
    } finally {
      working(false);
    }
  }
  function confirm() {
    if (!draft) return;
    onChange({
      ...value,
      items: value.items.some((item) => item.id === draft.id)
        ? value.items.map((item) => (item.id === draft.id ? draft : item))
        : [...value.items, draft],
    });
    setDraft(null);
    setMessage('');
  }
  return (
    <Tabs.Root
      className="admin-project-manager"
      value={tab}
      onValueChange={(next) => {
        if (busy) return;
        setTab(String(next));
        setDraft(null);
        setMessage('');
      }}
    >
      <Tabs.List className="admin-settings-tabs" aria-label="电影与分类管理">
        <Tabs.Tab value="films" disabled={busy}>
          电影管理 <small>{value.items.length}</small>
        </Tabs.Tab>
        <Tabs.Tab value="categories" disabled={busy}>
          电影分类 <small>{value.categories.length}</small>
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="films">
        {draft ? (
          <fieldset className="admin-film-editor" disabled={busy}>
            <div className="admin-section-heading">
              <button
                type="button"
                onClick={() => {
                  setDraft(null);
                  setMessage('');
                }}
              >
                ← 返回电影列表
              </button>
              <small>确认电影后再保存栏目。直接返回会放弃本次编辑。</small>
            </div>
            <div className="admin-fields">
              {(
                [
                  ['title', '电影标题'],
                  ['director', '导演'],
                  ['genre', '类型'],
                  ['country', '国家'],
                  ['language', '语言'],
                ] as const
              ).map(([key, label]) => (
                <div className="admin-field" key={key}>
                  <label htmlFor={`film-${key}`}>{label}</label>
                  <input
                    id={`film-${key}`}
                    value={draft[key]}
                    onChange={(event) => change({ [key]: event.target.value })}
                  />
                </div>
              ))}
              <div className="admin-field">
                <label htmlFor="film-category">电影分类</label>
                <select
                  id="film-category"
                  value={draft.categoryId}
                  onChange={(event) =>
                    change({ categoryId: event.target.value })
                  }
                >
                  <option value="" disabled>
                    请选择电影分类
                  </option>
                  {value.categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <section
                className="admin-wide admin-film-cover"
                aria-label="电影封面"
              >
                <div className="admin-film-poster">
                  {draft.cover ? (
                    <Image
                      src={draft.cover}
                      alt="电影封面预览"
                      width={180}
                      height={320}
                      unoptimized
                    />
                  ) : (
                    <span>尚未设置封面</span>
                  )}
                </div>
                <div>
                  <h3>电影封面</h3>
                  <div className="admin-choice">
                    {(['upload', 'ai'] as const).map((mode) => (
                      <label key={mode}>
                        <input
                          type="radio"
                          name="film-cover-mode"
                          checked={draft.coverMode === mode}
                          onChange={() => change({ coverMode: mode })}
                        />
                        {mode === 'upload' ? '上传文件' : 'AI 生成'}
                      </label>
                    ))}
                  </div>
                  <div className="admin-film-cover-actions">
                    {draft.coverMode === 'upload' ? (
                      <label className="admin-file-button">
                        上传电影封面
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          onChange={async (event) => {
                            const file = event.target.files?.[0];
                            const input = event.target;
                            if (!file) return;
                            working(true);
                            setMessage('正在上传…');
                            try {
                              if (!file.type.startsWith('image/'))
                                throw new Error('请选择图片文件');
                              const result = await upload(file);
                              change({
                                cover: result.url,
                                coverGeneratedFor: '',
                              });
                              setMessage('上传成功。');
                            } catch (error) {
                              setMessage(String(error));
                            } finally {
                              input.value = '';
                              working(false);
                            }
                          }}
                        />
                      </label>
                    ) : (
                      <div>
                        <button
                          type="button"
                          disabled={
                            !draft.title.trim() || !draft.director.trim()
                          }
                          onClick={() => void generate()}
                        >
                          {busy ? '生成中…' : '生成电影封面'}
                        </button>
                        <p className="admin-help">
                          根据名称、导演及 AI 设置中的电影配置生成 9:16 竖版
                          封面，使用中转站额度。失败保留原封面。仅点击“生成封面”按钮时调用
                          AI，确认修改不会重新生成。
                        </p>
                      </div>
                    )}
                    {draft.cover && (
                      <button
                        type="button"
                        onClick={() =>
                          change({ cover: '', coverGeneratedFor: '' })
                        }
                      >
                        移除封面
                      </button>
                    )}
                  </div>
                </div>
              </section>
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
                onClick={confirm}
              >
                {value.items.some((item) => item.id === draft.id)
                  ? '确认修改'
                  : '添加电影到列表'}
              </button>
            </div>
          </fieldset>
        ) : (
          <>
            <div className="admin-table-toolbar">
              <input
                type="search"
                aria-label="搜索电影"
                placeholder="搜索标题、导演或类型"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
              />
              <select
                aria-label="筛选电影分类"
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">全部电影分类</option>
                {value.categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="admin-primary"
                onClick={() => {
                  setDraft({
                    ...filmSample.items[0],
                    id: `film-${crypto.randomUUID()}`,
                    title: '',
                    categoryId: value.categories[0]?.id ?? '',
                  });
                  setMessage('');
                }}
              >
                ＋ 新增电影
              </button>
            </div>
            <div className="admin-table-scroll">
              <table className="admin-data-table">
                <caption>
                  共 {value.items.length} 部电影，筛选结果 {filtered.length}{' '}
                  部；保存栏目后生效。
                </caption>
                <thead>
                  <tr>
                    {[
                      '电影标题',
                      '导演',
                      '类型 / 国家 / 语言',
                      '电影分类',
                      '发布状态',
                      '操作',
                    ].map((label) => (
                      <th scope="col" key={label}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.rows.map((film) => (
                      <tr key={film.id}>
                        <td>
                          <button
                            type="button"
                            className="admin-table-title"
                            onClick={() => {
                              setDraft(structuredClone(film));
                              setMessage('');
                            }}
                          >
                            {film.title}
                          </button>
                        </td>
                        <td>{film.director || '—'}</td>
                        <td>
                          {[film.genre, film.country, film.language]
                            .filter(Boolean)
                            .join(' / ') || '—'}
                        </td>
                        <td>
                          {
                            value.categories.find(
                              (item) => item.id === film.categoryId,
                            )?.name
                          }
                        </td>
                        <td>
                          <span
                            className={`admin-status-badge ${film._published ? 'published' : ''}`}
                          >
                            {film._published ? '已发布' : '草稿'}
                          </span>
                        </td>
                        <td aria-label={`${film.title}操作`}>
                          <div className="admin-row-actions">
                            <button
                              type="button"
                              onClick={() => {
                                setDraft(structuredClone(film));
                                setMessage('');
                              }}
                            >
                              编辑
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onChange({
                                  ...value,
                                  items: value.items.map((item) =>
                                    item.id === film.id
                                      ? {
                                          ...item,
                                          _published: !item._published,
                                        }
                                      : item,
                                  ),
                                })
                              }
                            >
                              {film._published ? '转草稿' : '发布'}
                            </button>
                            {[-1, 1].map((direction) => (
                              <button
                                type="button"
                                key={direction}
                                aria-label={`${direction < 0 ? '上移' : '下移'}电影 ${film.title}`}
                                disabled={
                                  value.items.indexOf(film) + direction < 0 ||
                                  value.items.indexOf(film) + direction >=
                                    value.items.length
                                }
                                onClick={() => {
                                  const items = [...value.items];
                                  const index = items.indexOf(film);
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
                                if (
                                  window.confirm(
                                    `删除电影「${film.title}」？保存后生效。`,
                                  )
                                )
                                  onChange({
                                    ...value,
                                    items: value.items.filter(
                                      (item) => item.id !== film.id,
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
                <p className="admin-empty">
                  暂无匹配电影，可以调整筛选或新增。
                </p>
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
        <div className="admin-section-heading">
          <div>
            <h2>电影分类</h2>
            <p className="admin-help">
              改名会同步前台。删除前需移走关联电影（含草稿）。
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...value,
                categories: [
                  ...value.categories,
                  { id: `film-category-${crypto.randomUUID()}`, name: '' },
                ],
              })
            }
          >
            ＋ 新增电影分类
          </button>
        </div>
        {value.categories.map((category, index) => (
          <div className="admin-option-row" key={category.id}>
            <label htmlFor={`film-category-${category.id}`}>
              电影分类 {index + 1}
            </label>
            <input
              id={`film-category-${category.id}`}
              value={category.name}
              onChange={(event) =>
                onChange({
                  ...value,
                  categories: value.categories.map((item) =>
                    item.id === category.id
                      ? { ...item, name: event.target.value }
                      : item,
                  ),
                })
              }
            />
            <small>
              {
                value.items.filter((item) => item.categoryId === category.id)
                  .length
              }{' '}
              部
            </small>
            <button
              type="button"
              aria-label={`删除电影分类 ${category.name}`}
              disabled={value.items.some(
                (item) => item.categoryId === category.id,
              )}
              onClick={() => {
                if (window.confirm(`删除分类「${category.name}」？`)) {
                  onChange({
                    ...value,
                    categories: value.categories.filter(
                      (item) => item.id !== category.id,
                    ),
                  });
                  setCategory('');
                }
              }}
            >
              删除
            </button>
          </div>
        ))}
      </Tabs.Panel>
      <output className="admin-help" aria-live="polite">
        {message}
      </output>
    </Tabs.Root>
  );
}
