'use client';
import {
  AdminPlaylistCover,
  createPlaylistCover,
} from './admin-playlist-cover';
import { useEffect, useRef, useState } from 'react';
import { Tabs } from '@base-ui/react/tabs';
import {
  type MusicDocument,
  type MusicTrack,
  type MusicPlaylist,
  musicSample,
  migrateMusic,
  playlistCoverInput,
} from '@/lib/music-content';
import { formatTime } from '@/lib/music';
import { Field } from './admin-fields';
import { AdminTablePagination, pageRows } from './admin-data-table';

export function AdminMusicManager({
  value,
  onChange,
  onWorking,
}: {
  value: MusicDocument;
  onChange: (value: MusicDocument) => void;
  onWorking?: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  function working(next: boolean) {
    setBusy(next);
    onWorking?.(next);
  }
  const [tab, setTab] = useState('items');
  const [editing, setEditing] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState<MusicTrack | MusicPlaylist | null>(null);
  const isTracks = tab === 'items';
  const label = isTracks ? '音乐' : '歌单';
  const track = draft && 'src' in draft ? draft : undefined;
  const playlist = draft && 'songs' in draft ? draft : undefined;
  const records = isTracks ? value.items : value.playlists;
  const filtered = records.filter(
    (item) =>
      (status === 'all' || item._published === (status === 'published')) &&
      [
        item.title,
        ...('artist' in item ? [item.artist, item.mood] : [item.description]),
      ]
        .join(' ')
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const paginated = pageRows(filtered, page);
  const editTrack = (id: string, patch: Partial<MusicTrack>) => {
    if (track?.id === id) {
      setDraft((current) =>
        current?.id === id && 'src' in current
          ? { ...current, ...patch }
          : current,
      );
      return;
    }
    onChange({
      ...value,
      items: value.items.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });
  };
  const editPlaylist = (id: string, patch: Partial<MusicPlaylist>) => {
    if (playlist?.id === id) {
      setDraft((current) =>
        current?.id === id && 'songs' in current
          ? { ...current, ...patch }
          : current,
      );
      return;
    }
    onChange({
      ...value,
      playlists: value.playlists.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });
  };
  function open(item: MusicTrack | MusicPlaylist) {
    setEditing(item.id);
    setDraft(structuredClone('src' in item ? { ...item, duration: 0 } : item));
  }
  function add() {
    const id = `music-${crypto.randomUUID()}`;
    setEditing(id);
    setDraft(
      isTracks
        ? {
            ...musicSample.items[0],
            id,
            title: '',
            src: '',
            duration: 0,
            moodId: value.scenes[0]?.id ?? '',
          }
        : { ...musicSample.playlists[0], id, title: '', songs: [] },
    );
  }
  async function confirm() {
    working(true);
    setMessage('');
    try {
      if (track)
        onChange(
          migrateMusic({
            ...value,
            items: value.items.some((item) => item.id === track.id)
              ? value.items.map((item) => (item.id === track.id ? track : item))
              : [...value.items, track],
          }),
        );
      if (playlist) {
        const list =
          playlist.coverMode === 'ai' &&
          (!playlist.cover ||
            playlist.coverGeneratedFor !== playlistCoverInput(playlist))
            ? await createPlaylistCover(playlist)
            : playlist;
        onChange({
          ...value,
          playlists: value.playlists.some((item) => item.id === list.id)
            ? value.playlists.map((item) => (item.id === list.id ? list : item))
            : [...value.playlists, list],
        });
      }
      setDraft(null);
      setEditing('');
    } catch (error) {
      setMessage(String(error));
    } finally {
      working(false);
    }
  }
  function move(id: string, direction: number) {
    if (isTracks) {
      const items = [...value.items];
      const index = items.findIndex((item) => item.id === id);
      [items[index], items[index + direction]] = [
        items[index + direction],
        items[index],
      ];
      onChange({ ...value, items });
    } else {
      const playlists = [...value.playlists];
      const index = playlists.findIndex((item) => item.id === id);
      [playlists[index], playlists[index + direction]] = [
        playlists[index + direction],
        playlists[index],
      ];
      onChange({ ...value, playlists });
    }
  }
  return (
    <Tabs.Root
      className="admin-project-manager"
      value={tab}
      onValueChange={(next) => {
        if (busy) return;
        setMessage('');
        setTab(String(next));
        setEditing('');
        setDraft(null);
        setQuery('');
        setStatus('all');
        setPage(1);
      }}
    >
      <Tabs.List className="admin-settings-tabs" aria-label="音乐与歌单管理">
        <Tabs.Tab value="items">
          音乐管理 <small>{value.items.length}</small>
        </Tabs.Tab>
        <Tabs.Tab value="playlists">
          歌单管理 <small>{value.playlists.length}</small>
        </Tabs.Tab>
        <Tabs.Tab value="scenes">
          场景管理 <small>{value.scenes.length}</small>
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value={tab}>
        {tab === 'scenes' ? (
          <section className="admin-project-options">
            <div className="admin-section-heading">
              <h2>场景管理</h2>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    scenes: [
                      ...value.scenes,
                      { id: `scene-${crypto.randomUUID()}`, name: '' },
                    ],
                  })
                }
              >
                ＋ 新增场景
              </button>
            </div>
            <p className="admin-help">
              改名会同步关联音乐。删除前需移走关联音乐（含草稿），保存栏目后生效。
            </p>
            {value.scenes.map((scene, index) => (
              <div className="admin-option-row" key={scene.id}>
                <label htmlFor={`scene-${scene.id}`}>场景 {index + 1}</label>
                <input
                  id={`scene-${scene.id}`}
                  value={scene.name}
                  onChange={(event) =>
                    onChange(
                      migrateMusic({
                        ...value,
                        scenes: value.scenes.map((item) =>
                          item.id === scene.id
                            ? { ...item, name: event.target.value }
                            : item,
                        ),
                      }),
                    )
                  }
                />
                <small>
                  {
                    value.items.filter((item) => item.moodId === scene.id)
                      .length
                  }{' '}
                  首音乐
                </small>
                <button
                  type="button"
                  aria-label={`删除场景 ${scene.name}`}
                  disabled={value.items.some(
                    (item) => item.moodId === scene.id,
                  )}
                  onClick={() => {
                    if (window.confirm(`删除场景「${scene.name}」？`))
                      onChange({
                        ...value,
                        scenes: value.scenes.filter(
                          (item) => item.id !== scene.id,
                        ),
                      });
                  }}
                >
                  删除
                </button>
              </div>
            ))}
          </section>
        ) : track || playlist ? (
          <fieldset
            disabled={busy}
            className="admin-project-edit admin-music-editor"
          >
            <div className="admin-section-heading">
              <button
                type="button"
                onClick={() => {
                  setEditing('');
                  setDraft(null);
                }}
              >
                ← 返回{label}列表
              </button>
              <span className="admin-help">
                先确认本条修改，再保存栏目；直接返回会放弃本次编辑。
              </span>
            </div>
            <div className="admin-fields">
              {track && (
                <>
                  {(
                    [
                      ['title', '音乐名称'],
                      ['artist', '音乐作者'],
                    ] as const
                  ).map(([key, name]) => (
                    <Field
                      key={key}
                      path={`music.${key}`}
                      label={name}
                      value={track[key]}
                      sample={musicSample.items[0][key]}
                      onChange={(next) =>
                        editTrack(track.id, {
                          [key]: next,
                        })
                      }
                    />
                  ))}
                  <div className="admin-music-audio-row admin-wide">
                    <Field
                      path="music.src"
                      label="音频地址"
                      value={track.src}
                      sample={musicSample.items[0].src}
                      onChange={(next) =>
                        editTrack(track.id, {
                          src: next as string,
                          duration: 0,
                        })
                      }
                    />
                    <AudioDuration
                      key={`${track.id}:${track.src}`}
                      src={track.src}
                      onDuration={(duration) =>
                        editTrack(track.id, { duration })
                      }
                    />
                  </div>
                  <div className="admin-field">
                    <label htmlFor="music-scene">场景</label>
                    <select
                      id="music-scene"
                      value={track.moodId}
                      onChange={(event) =>
                        editTrack(track.id, { moodId: event.target.value })
                      }
                    >
                      <option value="" disabled>
                        请选择场景
                      </option>
                      {value.scenes.map((scene) => (
                        <option key={scene.id} value={scene.id}>
                          {scene.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Field
                    path="music._published"
                    label="发布到前台"
                    value={track._published}
                    sample={false}
                    onChange={(next) =>
                      editTrack(track.id, { _published: Boolean(next) })
                    }
                  />
                </>
              )}
              {playlist && (
                <>
                  {(
                    [
                      ['title', '歌单名称'],
                      ['description', '歌单简介'],
                      ['color', '封面底色'],
                      ['_published', '发布到前台'],
                    ] as const
                  ).map(([key, name]) => (
                    <Field
                      key={key}
                      path={`playlist.${key}`}
                      label={name}
                      value={playlist[key]}
                      sample={musicSample.playlists[0][key]}
                      onChange={(next) =>
                        editPlaylist(playlist.id, { [key]: next })
                      }
                    />
                  ))}
                  <AdminPlaylistCover
                    list={playlist}
                    onChange={(patch) => editPlaylist(playlist.id, patch)}
                    onWorking={working}
                  />
                  <section
                    className="admin-wide admin-music-picker"
                    aria-label="歌单歌曲"
                  >
                    <h3>歌曲信息 · {playlist.songs.length} 首</h3>
                    <p className="admin-help">
                      独立记录歌曲名称和歌手，仅供查看。
                    </p>
                    <ol className="admin-music-selected">
                      {playlist.songs.map((song, index) => (
                        <li key={index}>
                          <span>{index + 1}</span>
                          <input
                            aria-label={`歌曲名称 ${index + 1}`}
                            placeholder="歌曲名称"
                            value={song.title}
                            onChange={(event) =>
                              editPlaylist(playlist.id, {
                                songs: playlist.songs.map((item, i) =>
                                  i === index
                                    ? { ...item, title: event.target.value }
                                    : item,
                                ),
                              })
                            }
                          />
                          <input
                            aria-label={`歌手 ${index + 1}`}
                            placeholder="歌手"
                            value={song.artist}
                            onChange={(event) =>
                              editPlaylist(playlist.id, {
                                songs: playlist.songs.map((item, i) =>
                                  i === index
                                    ? { ...item, artist: event.target.value }
                                    : item,
                                ),
                              })
                            }
                          />
                          {[-1, 1].map((direction) => (
                            <button
                              type="button"
                              key={direction}
                              aria-label={`${direction < 0 ? '上移' : '下移'}歌曲 ${index + 1}`}
                              disabled={
                                index + direction < 0 ||
                                index + direction >= playlist.songs.length
                              }
                              onClick={() => {
                                const songs = [...playlist.songs];
                                [songs[index], songs[index + direction]] = [
                                  songs[index + direction],
                                  songs[index],
                                ];
                                editPlaylist(playlist.id, { songs });
                              }}
                            >
                              {direction < 0 ? '↑' : '↓'}
                            </button>
                          ))}
                          <button
                            type="button"
                            aria-label={`移除歌曲 ${index + 1}`}
                            onClick={() =>
                              editPlaylist(playlist.id, {
                                songs: playlist.songs.filter(
                                  (_, i) => i !== index,
                                ),
                              })
                            }
                          >
                            移除
                          </button>
                        </li>
                      ))}
                    </ol>
                    <button
                      type="button"
                      onClick={() =>
                        editPlaylist(playlist.id, {
                          songs: [...playlist.songs, { title: '', artist: '' }],
                        })
                      }
                    >
                      ＋ 添加歌曲
                    </button>
                  </section>
                </>
              )}
            </div>
            <div className="admin-music-actions">
              <button
                type="button"
                className="admin-primary"
                disabled={
                  busy ||
                  (playlist?.coverMode === 'ai' &&
                    !playlist.description.trim()) ||
                  !draft?.title.trim() ||
                  !!(
                    track &&
                    (!track.duration ||
                      !value.scenes.some((scene) => scene.id === track.moodId))
                  ) ||
                  !!playlist?.songs.some((song) => !song.title.trim())
                }
                onClick={() => void confirm()}
              >
                {records.some((item) => item.id === editing)
                  ? '确认修改'
                  : `添加${label}到列表`}
              </button>
              <output aria-live="polite">{message}</output>
            </div>
          </fieldset>
        ) : (
          <>
            <div className="admin-table-toolbar">
              <input
                type="search"
                aria-label={`搜索${label}`}
                placeholder={`搜索${label}名称${isTracks ? '、作者或场景' : '或简介'}`}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
              />
              <select
                aria-label={`筛选${label}发布状态`}
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
              >
                <option value="all">全部发布状态</option>
                <option value="published">已发布</option>
                <option value="draft">草稿</option>
              </select>
              <button type="button" className="admin-primary" onClick={add}>
                ＋ 新增{label}
              </button>
            </div>
            <div className="admin-table-scroll">
              <table className="admin-data-table">
                <caption>
                  共 {records.length} 条{label}，筛选结果 {filtered.length} 条。
                </caption>
                <thead>
                  <tr>
                    <th scope="col">{label}名称</th>
                    <th scope="col">{isTracks ? '作者 / 场景' : '歌曲数量'}</th>
                    <th scope="col">{isTracks ? '时长' : '简介'}</th>
                    <th scope="col">发布状态</th>
                    <th scope="col">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.rows.map((item) => {
                      const index = records.findIndex(
                        (record) => record.id === item.id,
                      );
                      return (
                        <tr key={item.id}>
                          <td>
                            <button
                              type="button"
                              className="admin-table-title"
                              onClick={() => {
                                open(item);
                              }}
                            >
                              {item.title}
                            </button>
                          </td>
                          <td>
                            {'artist' in item ? (
                              <>
                                {item.artist}
                                <small>{item.mood}</small>
                              </>
                            ) : (
                              `${item.songs.length} 首`
                            )}
                          </td>
                          <td>
                            {'duration' in item
                              ? formatTime(item.duration)
                              : item.description}
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
                              <button type="button" onClick={() => open(item)}>
                                编辑
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  isTracks
                                    ? editTrack(item.id, {
                                        _published: !item._published,
                                      })
                                    : editPlaylist(item.id, {
                                        _published: !item._published,
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
                                    index + direction < 0 ||
                                    index + direction >= records.length
                                  }
                                  onClick={() => move(item.id, direction)}
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
                                      `删除${label}「${item.title}」？保存后生效。`,
                                    )
                                  )
                                    onChange(
                                      isTracks
                                        ? {
                                            ...value,
                                            items: value.items.filter(
                                              (old) => old.id !== item.id,
                                            ),
                                          }
                                        : {
                                            ...value,
                                            playlists: value.playlists.filter(
                                              (old) => old.id !== item.id,
                                            ),
                                          },
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
                  暂无匹配的{label}，可以调整搜索或新增。
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
    </Tabs.Root>
  );
}

function AudioDuration({
  src,
  onDuration,
}: {
  src: string;
  onDuration: (duration: number) => void;
}) {
  const [message, setMessage] = useState(
    src ? '正在读取音频时长…' : '选择音频后自动读取时长',
  );
  const completed = useRef(false);
  useEffect(() => {
    if (!src) return;
    const timer = window.setTimeout(() => {
      if (!completed.current)
        setMessage('读取超时，请检查音频地址或重新上传。');
    }, 20000);
    return () => window.clearTimeout(timer);
  }, [src]);
  return (
    <div className="admin-field">
      <span>音频时长（自动读取）</span>
      <output aria-live="polite">{message}</output>
      {src && (
        <audio
          aria-label="音频时长检测"
          src={src}
          preload="metadata"
          muted
          hidden
          onLoadedMetadata={(event) => {
            if (!event.currentTarget.isConnected) return;
            const seconds = event.currentTarget.duration;
            completed.current = true;
            if (Number.isFinite(seconds) && seconds > 0) {
              onDuration(seconds);
              setMessage(formatTime(seconds));
            } else {
              onDuration(0);
              setMessage('无法读取有效时长，请更换音频文件。');
            }
          }}
          onError={(event) => {
            if (!event.currentTarget.isConnected) return;
            completed.current = true;
            onDuration(0);
            setMessage('音频读取失败，请检查地址或重新上传。');
          }}
        />
      )}
    </div>
  );
}
