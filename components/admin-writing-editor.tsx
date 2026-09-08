'use client';
import { useState } from 'react';
import Image from 'next/image';
import { AdminMarkdownEditor } from './admin-markdown-editor';
import { DayPicker } from 'react-day-picker';
import { zhCN } from 'react-day-picker/locale';
import { format, parse, isValid } from 'date-fns';
import type { Content } from '@/lib/cms-defaults';
import { Popover } from '@base-ui/react/popover';
import { CalendarDays } from 'lucide-react';
import { categoryRows, coverInput } from '@/lib/article-categories';
import { api, upload } from './admin-fields';
import 'react-day-picker/style.css';

export type Article = Content['writing'][number];
export async function createArticleCover(article: Article) {
  const result = await api<{ url: string; generatedFor: string }>(
    '/api/admin/ai',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'cover',
        title: article.title,
        excerpt: article.excerpt,
      }),
    },
  );
  return {
    ...article,
    cover: result.url,
    coverGeneratedFor: result.generatedFor,
  };
}

export function AdminWritingEditor({
  article,
  categories,
  onChange,
  onWorking,
  disabled = false,
}: {
  article: Article;
  categories: Content['categories'];
  onChange: (article: Article) => void;
  onWorking: (working: boolean) => void;
  disabled?: boolean;
}) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [working, setWorking] = useState(false);
  const date = parse(
    article.date.replaceAll('-', '.'),
    'yyyy.MM.dd',
    new Date(),
  );
  const selectedDate = isValid(date) ? date : undefined;
  const set = <K extends keyof Article>(key: K, value: Article[K]) =>
    onChange({ ...article, [key]: value });
  const needsCover =
    article.coverMode === 'ai' &&
    (!article.cover ||
      article.coverGeneratedFor !== coverInput(article.title, article.excerpt));
  async function generate() {
    setWorking(true);
    onWorking(true);
    setMessage('正在根据标题和摘要生成封面，可能需要几分钟…');
    try {
      onChange(await createArticleCover(article));
      setMessage('封面已生成并存入素材库，保存文章后生效。');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : '生成失败，原封面已保留。',
      );
    } finally {
      setWorking(false);
      onWorking(false);
    }
  }
  return (
    <div className="admin-writing-editor">
      <div className="admin-fields">
        <div className="admin-field admin-wide">
          <label htmlFor="article-title">文章标题</label>
          <input
            id="article-title"
            value={article.title}
            onChange={(e) => set('title', e.target.value)}
            maxLength={500}
          />
        </div>
        <div className="admin-field admin-wide">
          <label htmlFor="article-excerpt">文章摘要</label>
          <textarea
            id="article-excerpt"
            rows={4}
            value={article.excerpt}
            onChange={(e) => set('excerpt', e.target.value)}
            maxLength={5000}
          />
        </div>
        <div className="admin-field">
          <label htmlFor="article-category">文章分类</label>
          <select
            id="article-category"
            value={article.categoryId}
            onChange={(e) =>
              onChange({
                ...article,
                categoryId: e.target.value,
                category:
                  categories.find((category) => category.id === e.target.value)
                    ?.name ?? '',
              })
            }
          >
            <option value="" disabled>
              请选择分类
            </option>
            {categoryRows(categories).map(({ category, path }) => (
              <option key={category.id} value={category.id}>
                {path}
              </option>
            ))}
          </select>
          {!categories.length && (
            <small>请先在左侧「文章分类」中新增分类。</small>
          )}
        </div>
        <div className="admin-field">
          <label htmlFor="article-date">发布日期</label>
          <Popover.Root
            open={calendarOpen && !disabled}
            onOpenChange={setCalendarOpen}
          >
            <Popover.Trigger
              id="article-date"
              className="admin-date-trigger"
              disabled={disabled}
            >
              {article.date || '选择日期'}
              <CalendarDays size={17} />
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner
                sideOffset={6}
                align="end"
                className="admin-floating-positioner"
              >
                <Popover.Popup className="admin-floating admin-calendar-popup">
                  <Popover.Title className="admin-calendar-title">
                    选择发布日期
                  </Popover.Title>{' '}
                  <DayPicker
                    mode="single"
                    required
                    selected={selectedDate}
                    defaultMonth={selectedDate}
                    locale={zhCN}
                    captionLayout="dropdown"
                    startMonth={new Date(2000, 0)}
                    endMonth={new Date(new Date().getFullYear() + 10, 11)}
                    onSelect={(day) => {
                      set('date', format(day, 'yyyy.MM.dd'));
                      setCalendarOpen(false);
                    }}
                  />
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
          <small>这是文章展示日期，不是定时发布。</small>
        </div>
        <fieldset className="admin-choice admin-wide">
          <legend>发布状态</legend>
          <label>
            <input
              type="radio"
              name="article-publication"
              checked={!article._published}
              onChange={() => set('_published', false)}
            />
            草稿
          </label>
          <label>
            <input
              type="radio"
              name="article-publication"
              checked={article._published}
              onChange={() => set('_published', true)}
            />
            发布到前台
          </label>
        </fieldset>
        <fieldset className="admin-cover admin-wide">
          <legend>文章封面</legend>
          <div className="admin-choice">
            <label>
              <input
                type="radio"
                name="article-cover-mode"
                checked={article.coverMode === 'upload'}
                onChange={() => set('coverMode', 'upload')}
              />
              上传文件
            </label>
            <label>
              <input
                type="radio"
                name="article-cover-mode"
                checked={article.coverMode === 'ai'}
                onChange={() => set('coverMode', 'ai')}
              />
              AI 生成
            </label>
          </div>
          <div className="admin-cover-layout">
            <div className="admin-cover-image">
              {article.cover ? (
                <Image
                  src={article.cover}
                  alt="当前文章封面"
                  width={600}
                  height={400}
                  unoptimized
                />
              ) : (
                <span>尚未设置文章封面</span>
              )}
            </div>
            <div className="admin-cover-actions">
              {article.coverMode === 'ai' ? (
                <>
                  <p>
                    使用「AI
                    大模型设置」中已保存的模型、风格和提示词，根据文章标题与摘要生成。
                  </p>
                  <button
                    type="button"
                    disabled={
                      working ||
                      !article.title.trim() ||
                      !article.excerpt.trim()
                    }
                    onClick={() => void generate()}
                  >
                    {working
                      ? '生成中…'
                      : article.coverGeneratedFor
                        ? '重新生成封面'
                        : '生成文章封面'}
                  </button>
                  <small>
                    {needsCover
                      ? '尚未生成，或标题 / 摘要已变化。保存时会自动生成封面。'
                      : '封面已对应当前标题和摘要。'}
                    生成会使用中转站额度。
                  </small>
                </>
              ) : (
                <>
                  <p>上传 PNG、JPEG、WebP 或 GIF 图片，最大 20 MB。</p>
                  <label className="admin-file-button">
                    选择封面文件
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setWorking(true);
                        onWorking(true);
                        setMessage('正在上传…');
                        try {
                          if (!file.type.startsWith('image/'))
                            throw new Error('请选择图片文件');
                          const result = await upload(file);
                          onChange({
                            ...article,
                            cover: result.url,
                            coverGeneratedFor: '',
                          });
                          setMessage('上传成功，保存文章后生效。');
                        } catch (error) {
                          setMessage(String(error));
                        } finally {
                          setWorking(false);
                          onWorking(false);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                  <label className="admin-field" htmlFor="article-cover-url">
                    或使用已有素材地址
                    <input
                      id="article-cover-url"
                      value={article.cover}
                      onChange={(e) =>
                        onChange({
                          ...article,
                          cover: e.target.value,
                          coverGeneratedFor: '',
                        })
                      }
                    />
                  </label>
                </>
              )}
              <output>{message}</output>
            </div>
          </div>
        </fieldset>
        <AdminMarkdownEditor
          label="文章正文"
          value={article.body}
          onChange={(body) => set('body', body)}
        />
        {(
          [
            ['label', '内容标签'],
            ['tag', '主题标签'],
          ] as const
        ).map(([key, label]) => (
          <div className="admin-field" key={key}>
            <label htmlFor={`article-${key}`}>{label}</label>
            <input
              id={`article-${key}`}
              value={article[key]}
              onChange={(e) => set(key, e.target.value)}
            />
          </div>
        ))}
        <details className="admin-article-extra admin-wide">
          <summary>文章链接与阅读时长</summary>
          <div className="admin-fields">
            {(
              [
                ['slug', '文章路径标识'],
                ['meta', '阅读时长'],
              ] as const
            ).map(([key, label]) => (
              <div className="admin-field" key={key}>
                <label htmlFor={`article-${key}`}>{label}</label>
                <input
                  id={`article-${key}`}
                  value={article[key]}
                  onChange={(e) => set(key, e.target.value)}
                />
              </div>
            ))}
          </div>
          <small>
            文章地址：/writing/{article.slug}。修改路径后旧链接不再有效。
          </small>
        </details>
      </div>
    </div>
  );
}
