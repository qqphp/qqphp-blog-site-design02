'use client';
import { useState } from 'react';
import Image from 'next/image';
import {
  storyDate,
  normalizeStoryTopics,
  newestStoriesFirst,
  type Story,
} from '@/lib/story-content';
import { AdminTags } from './admin-tags';
import { api, upload } from './admin-fields';
import { AdminTablePagination, pageRows } from './admin-data-table';

export function AdminStoryManager({
  stories,
  onChange,
  onWorking,
}: {
  stories: Story[];
  onChange: (stories: Story[]) => void;
  onWorking: (busy: boolean) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState('');
  const story = stories.find((item) => item.id === editing);
  const filtered = newestStoriesFirst(stories).filter(
    (item) =>
      (status === 'all' || item._published === (status === 'published')) &&
      `${item.text} ${item.topics.join(' ')}`
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
  );
  const paginated = pageRows(filtered, page);
  function update(change: Partial<Story>) {
    onChange(
      stories.map((item) =>
        item.id === editing ? { ...item, ...change } : item,
      ),
    );
  }
  async function imageTask(task: () => Promise<{ src: string; alt: string }>) {
    onWorking(true);
    setMessage('正在处理图片，请稍候…');
    try {
      const image = await task();
      update({ images: [...story!.images, image] });
      setMessage('图片已加入，保存栏目后生效。');
    } catch (error) {
      setMessage(String(error));
    } finally {
      onWorking(false);
    }
  }
  if (story)
    return (
      <div className="admin-form admin-story-editor">
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setMessage('');
          }}
        >
          ← 返回说说列表
        </button>
        <div className="admin-field">
          <label htmlFor="story-text">文字</label>
          <textarea
            id="story-text"
            rows={6}
            maxLength={5000}
            value={story.text}
            onChange={(e) => update({ text: e.target.value })}
          />
        </div>
        <section className="admin-story-images" aria-label="说说图片">
          <h3>图片</h3>
          <div className="admin-story-image-list">
            {story.images.map((image, index) => (
              <div key={index}>
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={240}
                  height={160}
                  unoptimized
                />
                <label>
                  图片说明
                  <input
                    value={image.alt}
                    onChange={(e) =>
                      update({
                        images: story.images.map((item, i) =>
                          i === index ? { ...item, alt: e.target.value } : item,
                        ),
                      })
                    }
                  />
                </label>
                <div className="admin-row-actions">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => {
                      const images = [...story.images];
                      [images[index - 1], images[index]] = [
                        images[index],
                        images[index - 1],
                      ];
                      update({ images });
                    }}
                  >
                    上移
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      update({
                        images: story.images.filter((_, i) => i !== index),
                      })
                    }
                  >
                    移除
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="admin-story-image-actions">
            <label className="admin-file-button">
              上传图片
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file)
                    void imageTask(async () => ({
                      src: (await upload(file)).url,
                      alt: file.name,
                    }));
                }}
              />
            </label>
            <button
              type="button"
              disabled={!story.text.trim()}
              onClick={() =>
                void imageTask(async () => {
                  const result = await api<{ url: string }>('/api/admin/ai', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      action: 'story-image',
                      title:
                        story.topics.join('、').slice(0, 500) || '说说配图',
                      excerpt: story.text,
                    }),
                  });
                  return { src: result.url, alt: story.text.slice(0, 80) };
                })
              }
            >
              AI 生成图片
            </button>
          </div>
          <output>{message}</output>
        </section>
        <div className="admin-field admin-story-date">
          <label htmlFor="story-date">发布日期（北京时间）</label>
          <input
            id="story-date"
            type="datetime-local"
            step="1"
            required
            value={story.date.slice(0, 19)}
            onChange={(e) =>
              update({
                date: e.target.value
                  ? `${e.target.value.length === 16 ? e.target.value + ':00' : e.target.value}+08:00`
                  : '',
              })
            }
          />
        </div>
        <AdminTags
          label="话题"
          value={story.topics}
          onChange={(topics) =>
            update({ topics: normalizeStoryTopics(topics) })
          }
        />
        <div className="admin-field admin-story-status">
          <label htmlFor="story-status">发布状态</label>
          <select
            id="story-status"
            value={story._published ? 'published' : 'draft'}
            onChange={(e) =>
              update({ _published: e.target.value === 'published' })
            }
          >
            <option value="draft">草稿</option>
            <option value="published">已发布</option>
          </select>
        </div>
      </div>
    );
  return (
    <div className="admin-form">
      <div className="admin-table-toolbar">
        <input
          type="search"
          aria-label="搜索说说"
          placeholder="搜索文字或话题"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />
        <select
          aria-label="按发布状态筛选说说"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">全部状态</option>
          <option value="draft">草稿</option>
          <option value="published">已发布</option>
        </select>
        <button
          type="button"
          onClick={() => {
            const item: Story = {
              id: crypto.randomUUID(),
              date: storyDate(new Date()),
              text: '',
              topics: [],
              images: [],
              _published: false,
            };
            onChange([...stories, item]);
            setEditing(item.id);
          }}
        >
          ＋ 新增说说
        </button>
      </div>
      <div className="admin-table-scroll">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th scope="col">文字</th>
              <th scope="col">话题</th>
              <th scope="col">发布日期</th>
              <th scope="col">状态</th>
              <th scope="col">操作</th>
            </tr>
          </thead>
          <tbody>
            {paginated.rows.map((item) => (
              <tr key={item.id}>
                <td>
                  <button
                    type="button"
                    className="admin-table-title"
                    onClick={() => setEditing(item.id)}
                  >
                    {item.text || '未填写文字'}
                  </button>
                  <small>{item.images.length} 张图片</small>
                </td>
                <td>{item.topics.join(' / ') || '—'}</td>
                <td>
                  <time>{item.date.slice(0, 19).replace('T', ' ')}</time>
                </td>
                <td>
                  <span
                    className={`admin-status-badge ${item._published ? 'published' : ''}`}
                  >
                    {item._published ? '已发布' : '草稿'}
                  </span>
                </td>
                <td aria-label="说说操作">
                  <div className="admin-row-actions">
                    <button type="button" onClick={() => setEditing(item.id)}>
                      编辑
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onChange(
                          stories.map((s) =>
                            s.id === item.id
                              ? { ...s, _published: !s._published }
                              : s,
                          ),
                        )
                      }
                    >
                      {item._published ? '转为草稿' : '发布'}
                    </button>
                    <button
                      type="button"
                      className="admin-danger"
                      onClick={() => {
                        if (
                          window.confirm('删除这条说说？保存后前台将不再展示。')
                        )
                          onChange(stories.filter((s) => s.id !== item.id));
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
            {stories.length
              ? '没有符合筛选条件的说说。'
              : '暂无说说，点击“新增说说”开始创作。'}
          </p>
        )}
      </div>
      <AdminTablePagination
        page={paginated.current}
        total={filtered.length}
        onChange={setPage}
      />
    </div>
  );
}
