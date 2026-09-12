'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Tabs } from '@base-ui/react/tabs';
import {
  type Podcast,
  type PodcastDocument,
  podcastSample,
} from '@/lib/podcast-content';
import { api, upload } from './admin-fields';
import { AdminTablePagination, pageRows } from './admin-data-table';

export async function createPodcastCover(podcast: Podcast): Promise<Podcast> {
  const result = await api<{ url: string; generatedFor: string }>(
    '/api/admin/ai',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'podcast-cover',
        title: podcast.title,
        host: podcast.host,
        excerpt: podcast.description,
      }),
    },
  );
  return {
    ...podcast,
    cover: result.url,
    coverGeneratedFor: result.generatedFor,
  };
}
export function AdminPodcastManager({
  value,
  onChange,
  onWorking,
}: {
  value: PodcastDocument;
  onChange: (value: PodcastDocument) => void;
  onWorking: (busy: boolean) => void;
}) {
  const [tab, setTab] = useState('podcasts');
  const [draft, setDraft] = useState<Podcast | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const change = (patch: Partial<Podcast>) =>
    setDraft((current) => (current ? { ...current, ...patch } : current));
  const filtered = value.items.filter(
    (item) =>
      (!category || item.categoryId === category) &&
      [item.title, item.host, item.description]
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
    setMessage('正在生成播客封面，可能需要几分钟…');
    try {
      setDraft(await createPodcastCover(draft));
      setMessage('封面已生成，确认播客后保存栏目。');
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
      <Tabs.List className="admin-settings-tabs" aria-label="播客与分类管理">
        <Tabs.Tab value="podcasts" disabled={busy}>
          播客管理 <small>{value.items.length}</small>
        </Tabs.Tab>
        <Tabs.Tab value="categories" disabled={busy}>
          播客分类 <small>{value.categories.length}</small>
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="podcasts">
        {draft ? (
          <fieldset className="admin-podcast-editor" disabled={busy}>
            <div className="admin-section-heading">
              <button
                type="button"
                onClick={() => {
                  setDraft(null);
                  setMessage('');
                }}
              >
                ← 返回播客列表
              </button>
              <small>确认播客后再保存栏目。直接返回会放弃本次编辑。</small>
            </div>
            <div className="admin-fields">
              {(
                [
                  ['title', '播客标题'],
                  ['host', '主播'],
                ] as const
              ).map(([key, label]) => (
                <div className="admin-field" key={key}>
                  <label htmlFor={`podcast-${key}`}>{label}</label>
                  <input
                    id={`podcast-${key}`}
                    value={draft[key]}
                    onChange={(event) => change({ [key]: event.target.value })}
                  />
                </div>
              ))}
              <div className="admin-field admin-wide">
                <label htmlFor="podcast-description">简介</label>
                <textarea
                  id="podcast-description"
                  rows={4}
                  value={draft.description}
                  onChange={(event) =>
                    change({ description: event.target.value })
                  }
                />
              </div>
              <div className="admin-field">
                <label htmlFor="podcast-category">播客分类</label>
                <select
                  id="podcast-category"
                  value={draft.categoryId}
                  onChange={(event) =>
                    change({ categoryId: event.target.value })
                  }
                >
                  <option value="" disabled>
                    请选择播客分类
                  </option>
                  {value.categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-field admin-wide admin-podcast-audio">
                <label htmlFor="podcast-audio">节选音频</label>
                <label className="admin-file-button">
                  上传节选音频
                  <input
                    id="podcast-audio"
                    type="file"
                    accept="audio/mpeg,audio/wav"
                    onChange={async (event) => {
                      const input = event.target;
                      const file = input.files?.[0];
                      if (!file) return;
                      working(true);
                      setMessage('正在上传音频…');
                      try {
                        if (!file.type.startsWith('audio/'))
                          throw new Error('请选择音频文件');
                        const result = await upload(file);
                        change({ audio: result.url });
                        setMessage('音频上传成功。');
                      } catch (error) {
                        setMessage(String(error));
                      } finally {
                        input.value = '';
                        working(false);
                      }
                    }}
                  />
                </label>
                {draft.audio && (
                  <div className="admin-podcast-audio-preview">
                    {/* oxlint-disable-next-line jsx-a11y/media-has-caption -- Preview of the uploaded audio; no caption file is supplied. */}
                    <audio
                      controls
                      preload="none"
                      src={draft.audio}
                      aria-label="节选音频预览"
                    />
                    <button type="button" onClick={() => change({ audio: '' })}>
                      移除音频
                    </button>
                  </div>
                )}
              </div>
              <section
                className="admin-wide admin-podcast-cover"
                aria-label="播客封面"
              >
                <div className="admin-podcast-poster">
                  {draft.cover ? (
                    <Image
                      src={draft.cover}
                      alt="播客封面预览"
                      width={300}
                      height={200}
                      unoptimized
                    />
                  ) : (
                    <span>尚未设置封面</span>
                  )}
                </div>
                <div>
                  <h3>播客封面 · 3:2</h3>
                  <div className="admin-choice">
                    {(['upload', 'ai'] as const).map((mode) => (
                      <label key={mode}>
                        <input
                          type="radio"
                          name="podcast-cover-mode"
                          checked={draft.coverMode === mode}
                          onChange={() => change({ coverMode: mode })}
                        />
                        {mode === 'upload' ? '上传文件' : 'AI 生成'}
                      </label>
                    ))}
                  </div>
                  <div className="admin-podcast-cover-actions">
                    {draft.coverMode === 'upload' ? (
                      <label className="admin-file-button">
                        上传播客封面
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
                      <>
                        <button
                          type="button"
                          disabled={
                            !draft.title.trim() ||
                            !draft.host.trim() ||
                            !draft.description.trim()
                          }
                          onClick={() => void generate()}
                        >
                          {busy ? '生成中…' : '生成播客封面'}
                        </button>
                        <p className="admin-help">
                          根据标题、简介、主播及 AI 设置中的播客配置生成 3:2
                          横版
                          封面，使用中转站额度。失败保留原封面。仅点击“生成封面”按钮时调用
                          AI，确认修改不会重新生成。
                        </p>
                      </>
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
                  : '添加播客到列表'}
              </button>
            </div>
          </fieldset>
        ) : (
          <>
            <div className="admin-table-toolbar">
              <input
                type="search"
                aria-label="搜索播客"
                placeholder="搜索标题、主播或简介"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
              />
              <select
                aria-label="筛选播客分类"
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">全档播客分类</option>
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
                    ...podcastSample.items[0],
                    id: `podcast-${crypto.randomUUID()}`,
                    title: '',
                    categoryId: value.categories[0]?.id ?? '',
                  });
                  setMessage('');
                }}
              >
                ＋ 新增播客
              </button>
            </div>
            <div className="admin-table-scroll">
              <table className="admin-data-table">
                <caption>
                  共 {value.items.length} 档播客，筛选结果 {filtered.length}{' '}
                  档；保存栏目后生效。
                </caption>
                <thead>
                  <tr>
                    {[
                      '播客标题',
                      '主播',
                      '节选音频',
                      '播客分类',
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
                  {paginated.rows.map((podcast) => (
                      <tr key={podcast.id}>
                        <td>
                          <button
                            type="button"
                            className="admin-table-title"
                            onClick={() => {
                              setDraft(structuredClone(podcast));
                              setMessage('');
                            }}
                          >
                            {podcast.title}
                          </button>
                        </td>
                        <td>{podcast.host || '—'}</td>
                        <td>{podcast.audio ? '已上传' : '未上传'}</td>
                        <td>
                          {
                            value.categories.find(
                              (item) => item.id === podcast.categoryId,
                            )?.name
                          }
                        </td>
                        <td>
                          <span
                            className={`admin-status-badge ${podcast._published ? 'published' : ''}`}
                          >
                            {podcast._published ? '已发布' : '草稿'}
                          </span>
                        </td>
                        <td aria-label={`${podcast.title}操作`}>
                          <div className="admin-row-actions">
                            <button
                              type="button"
                              onClick={() => {
                                setDraft(structuredClone(podcast));
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
                                    item.id === podcast.id
                                      ? {
                                          ...item,
                                          _published: !item._published,
                                        }
                                      : item,
                                  ),
                                })
                              }
                            >
                              {podcast._published ? '转草稿' : '发布'}
                            </button>
                            {[-1, 1].map((direction) => (
                              <button
                                type="button"
                                key={direction}
                                aria-label={`${direction < 0 ? '上移' : '下移'}播客 ${podcast.title}`}
                                disabled={
                                  value.items.indexOf(podcast) + direction <
                                    0 ||
                                  value.items.indexOf(podcast) + direction >=
                                    value.items.length
                                }
                                onClick={() => {
                                  const items = [...value.items];
                                  const index = items.indexOf(podcast);
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
                                    `删除播客「${podcast.title}」？保存后生效。`,
                                  )
                                )
                                  onChange({
                                    ...value,
                                    items: value.items.filter(
                                      (item) => item.id !== podcast.id,
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
                  暂无匹配播客，可以调整筛选或新增。
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
            <h2>播客分类</h2>
            <p className="admin-help">
              改名会同步前台。删除前需移走关联播客（含草稿）。
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...value,
                categories: [
                  ...value.categories,
                  { id: `podcast-category-${crypto.randomUUID()}`, name: '' },
                ],
              })
            }
          >
            ＋ 新增播客分类
          </button>
        </div>
        {value.categories.map((category, index) => (
          <div className="admin-option-row" key={category.id}>
            <label htmlFor={`podcast-category-${category.id}`}>
              播客分类 {index + 1}
            </label>
            <input
              id={`podcast-category-${category.id}`}
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
              档
            </small>
            <button
              type="button"
              aria-label={`删除播客分类 ${category.name}`}
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
