'use client';
import { useState } from 'react';
import Image from 'next/image';
import { api, upload } from './admin-fields';
export function AdminCollectionCover({
  value,
  onChange,
  onWorking,
  portrait = false,
  kind,
  title,
  description = '',
  author = '',
}: {
  value: string;
  onChange: (url: string) => void;
  onWorking: (value: boolean) => void;
  portrait?: boolean;
  kind: 'travel' | 'hobby' | 'book' | 'booklist';
  title: string;
  description?: string;
  author?: string;
}) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const working = (value: boolean) => {
    setBusy(value);
    onWorking(value);
  };
  return (
    <div className="admin-wide collection-cover-field">
      <div className={`collection-cover-preview${portrait ? ' portrait' : ''}`}>
        {value ? (
          <Image
            src={value}
            alt="封面预览"
            width={portrait ? 160 : 300}
            height={portrait ? 240 : 200}
            unoptimized
          />
        ) : (
          <span>尚未设置封面</span>
        )}
      </div>
      <div>
        <h3>封面图片</h3>
        <div className="collection-cover-actions">
          <label className="admin-file-button">
            上传封面
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              disabled={busy}
              onChange={async (event) => {
                const input = event.target;
                const file = input.files?.[0];
                if (!file) return;
                working(true);
                setMessage('正在上传…');
                try {
                  if (!file.type.startsWith('image/'))
                    throw new Error('请选择图片文件');
                  const result = await upload(file);
                  onChange(result.url);
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
          <button
            type="button"
            disabled={
              busy || !title.trim() || (kind !== 'book' && !description.trim())
            }
            onClick={async () => {
              working(true);
              setMessage('正在生成封面，请稍候…');
              try {
                const result = await api<{ url: string }>('/api/admin/ai', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: `${kind}-cover`,
                    title,
                    excerpt: description,
                    author,
                  }),
                });
                onChange(result.url);
                setMessage('封面已生成，确认编辑并保存栏目后生效。');
              } catch (error) {
                setMessage(`生成失败，原封面已保留。${String(error)}`);
              } finally {
                working(false);
              }
            }}
          >
            {busy ? '处理中…' : 'AI 生成封面'}
          </button>
          {value && (
            <button type="button" disabled={busy} onClick={() => onChange('')}>
              移除封面
            </button>
          )}
        </div>
        <p className="admin-help">
          {kind === 'book'
            ? '根据书名和可选作者生成 2:3 竖版封面。'
            : '根据标题和简介生成 3:2 横版封面。'}
          仅点击生成按钮调用 AI，确认编辑不会自动生成。
        </p>
        <output aria-live="polite">{message}</output>
      </div>
    </div>
  );
}
