'use client';
import { useState } from 'react';
import Image from 'next/image';
import { upload } from './admin-fields';

export function AdminTravelAlbum({
  value,
  onChange,
  onWorking,
}: {
  value: string[];
  onChange: (images: string[]) => void;
  onWorking: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const move = (index: number, offset: number) => {
    const images = [...value];
    [images[index], images[index + offset]] = [
      images[index + offset],
      images[index],
    ];
    onChange(images);
  };
  return (
    <section className="admin-wide travel-album-editor" aria-label="旅行相册集">
      <h3>相册集</h3>
      <p className="admin-help">
        上传旅行风景图，支持多选，最多 50 张。按下方顺序展示在前台旅行详情中。
      </p>
      <label className="admin-file-button">
        上传相册图片
        <input
          type="file"
          aria-label="上传相册图片"
          multiple
          accept="image/png,image/jpeg,image/webp,image/gif"
          disabled={busy || value.length >= 50}
          onChange={async (event) => {
            const input = event.target;
            const files = Array.from(input.files ?? []);
            if (!files.length) return;
            if (files.length + value.length > 50) {
              setMessage('相册最多 50 张图片，请减少选择数量。');
              input.value = '';
              return;
            }
            setBusy(true);
            onWorking(true);
            const images = [...value];
            const failed: string[] = [];
            try {
              for (const [index, file] of files.entries()) {
                setMessage(`正在上传 ${index + 1} / ${files.length}…`);
                try {
                  if (!file.type.startsWith('image/'))
                    throw new Error('请选择图片');
                  images.push((await upload(file)).url);
                } catch {
                  failed.push(file.name);
                }
              }
              onChange(images);
              setMessage(
                failed.length
                  ? `部分上传失败：${failed.join('、')}。成功的图片已保留，可重新上传失败文件。`
                  : '上传完成，确认编辑并保存栏目后生效。',
              );
            } finally {
              input.value = '';
              setBusy(false);
              onWorking(false);
            }
          }}
        />
      </label>
      <output aria-live="polite">{message}</output>
      <div className="travel-album-grid">
        {value.map((url, index) => (
          <div className="travel-album-item" key={`${url}-${index}`}>
            <Image
              src={url}
              alt={`相册图片 ${index + 1}`}
              width={300}
              height={200}
              unoptimized
            />
            <div className="collection-cover-actions">
              <button
                type="button"
                aria-label={`前移图片 ${index + 1}`}
                disabled={busy || index === 0}
                onClick={() => move(index, -1)}
              >
                前移
              </button>
              <button
                type="button"
                aria-label={`后移图片 ${index + 1}`}
                disabled={busy || index === value.length - 1}
                onClick={() => move(index, 1)}
              >
                后移
              </button>
              <button
                type="button"
                aria-label={`移除图片 ${index + 1}`}
                disabled={busy}
                onClick={() => onChange(value.filter((_, i) => i !== index))}
              >
                移除
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
