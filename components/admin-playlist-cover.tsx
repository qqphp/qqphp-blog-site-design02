'use client';
import { useState } from 'react';
import Image from 'next/image';
import { type MusicPlaylist, playlistCoverInput } from '@/lib/music-content';
import { api, upload } from './admin-fields';
export async function createPlaylistCover(
  list: MusicPlaylist,
): Promise<MusicPlaylist> {
  const result = await api<{ url: string; generatedFor: string }>(
    '/api/admin/ai',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'playlist-cover',
        title: list.title,
        excerpt: list.description,
      }),
    },
  );
  return { ...list, cover: result.url, coverGeneratedFor: result.generatedFor };
}
export function AdminPlaylistCover({
  list,
  onChange,
  onWorking,
}: {
  list: MusicPlaylist;
  onChange: (patch: Partial<MusicPlaylist>) => void;
  onWorking: (busy: boolean) => void;
}) {
  const [message, setMessage] = useState('');
  async function generate() {
    onWorking(true);
    setMessage('正在生成歌单封面…');
    try {
      onChange(await createPlaylistCover(list));
      setMessage('已生成，请确认并保存栏目。');
    } catch (error) {
      setMessage(String(error));
    } finally {
      onWorking(false);
    }
  }
  return (
    <section className="admin-wide admin-playlist-cover" aria-label="歌单封面">
      <div className="admin-playlist-cover-image">
        {list.cover ? (
          <Image
            src={list.cover}
            alt="歌单封面预览"
            width={240}
            height={240}
            unoptimized
          />
        ) : (
          <span>封面待设置</span>
        )}
      </div>
      <div>
        <h3>歌单封面 · 1:1</h3>
        <div className="admin-choice">
          {(['upload', 'ai'] as const).map((mode) => (
            <label key={mode}>
              <input
                type="radio"
                name="playlist-cover-mode"
                checked={list.coverMode === mode}
                onChange={() => onChange({ coverMode: mode })}
              />
              {mode === 'upload' ? '上传文件' : 'AI 生成'}
            </label>
          ))}
        </div>
        {list.coverMode === 'ai' ? (
          <>
            <button
              type="button"
              disabled={!list.title.trim() || !list.description.trim()}
              onClick={() => void generate()}
            >
              生成歌单封面
            </button>
            <p className="admin-help">
              根据名称、简介与 AI
              设置中的音乐配置生成方形封面。确认时会生成缺失或信息变更的封面；失败保留原图。
            </p>
            {list.coverGeneratedFor === playlistCoverInput(list) && (
              <small>已对应当前歌单信息。</small>
            )}
          </>
        ) : (
          <label className="admin-file-button">
            上传歌单封面
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={async (event) => {
                const input = event.target;
                const file = input.files?.[0];
                if (!file) return;
                onWorking(true);
                setMessage('正在上传…');
                try {
                  if (!file.type.startsWith('image/'))
                    throw new Error('请选择图片文件');
                  const result = await upload(file);
                  onChange({ cover: result.url, coverGeneratedFor: '' });
                  setMessage('上传成功。');
                } catch (error) {
                  setMessage(String(error));
                } finally {
                  input.value = '';
                  onWorking(false);
                }
              }}
            />
          </label>
        )}
        {list.cover && (
          <button
            type="button"
            onClick={() => onChange({ cover: '', coverGeneratedFor: '' })}
          >
            移除封面
          </button>
        )}
        <output aria-live="polite">{message}</output>
      </div>
    </section>
  );
}
