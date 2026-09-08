'use client';
import { useState } from 'react';
import Image from 'next/image';
import {
  type Project,
  type ProjectImage,
  projectImageInput,
} from '@/lib/project-content';
import { api, upload } from './admin-fields';

export async function createProjectImage(
  project: Project,
  image: ProjectImage,
): Promise<ProjectImage> {
  const result = await api<{ url: string; generatedFor: string }>(
    '/api/admin/ai',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'project-cover',
        title: project.title,
        subtitle: project.subtitle,
        excerpt: project.description,
      }),
    },
  );
  return {
    ...image,
    src: result.url,
    generatedFor: result.generatedFor,
    alt: image.alt || project.title,
    label: image.label || '项目封面',
  };
}
export function AdminProjectImages({
  project,
  onChange,
  onWorking,
}: {
  project: Project;
  onChange: (images: ProjectImage[]) => void;
  onWorking: (busy: boolean) => void;
}) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  function update(index: number, update: Partial<ProjectImage>) {
    onChange(
      project.images.map((image, i) =>
        i === index ? { ...image, ...update } : image,
      ),
    );
  }
  async function generate(index: number) {
    setBusy(true);
    onWorking(true);
    setMessage('正在根据项目名称、副标题与摘要生成图片…');
    try {
      update(index, await createProjectImage(project, project.images[index]));
      setMessage('图片已生成，保存栏目后生效。');
    } catch (error) {
      setMessage(String(error));
    } finally {
      setBusy(false);
      onWorking(false);
    }
  }
  return (
    <section className="admin-project-images admin-wide">
      <div className="admin-section-heading">
        <h3>项目图片</h3>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            onChange([
              ...project.images,
              { src: '', label: '', alt: '', mode: 'upload', generatedFor: '' },
            ])
          }
        >
          ＋ 添加图片
        </button>
      </div>
      <p className="admin-help">
        第一张作为项目封面。可逐张上传或生成，调整顺序后统一保存。
      </p>
      {project.images.map((item, index) => (
        <div className="admin-project-image" key={index}>
          <div className="admin-cover-layout">
            <div className="admin-cover-image">
              {item.src ? (
                <Image
                  src={item.src}
                  alt={item.alt || '项目图片预览'}
                  width={420}
                  height={280}
                  unoptimized
                />
              ) : (
                <span>尚未设置图片</span>
              )}
            </div>
            <div className="admin-project-image-fields">
              <div className="admin-section-heading">
                <strong>
                  {index === 0 ? '项目封面' : `图片 ${index + 1}`}
                </strong>
                <div className="admin-row-actions">
                  {[-1, 1].map((direction) => (
                    <button
                      key={direction}
                      type="button"
                      disabled={
                        busy ||
                        index + direction < 0 ||
                        index + direction >= project.images.length
                      }
                      onClick={() => {
                        const images = [...project.images];
                        [images[index], images[index + direction]] = [
                          images[index + direction],
                          images[index],
                        ];
                        onChange(images);
                      }}
                    >
                      {direction < 0 ? '上移' : '下移'}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={busy}
                    className="admin-danger"
                    onClick={() => {
                      if (window.confirm('移除此图片？原文件仍保留在素材库。'))
                        onChange(project.images.filter((_, i) => i !== index));
                    }}
                  >
                    移除
                  </button>
                </div>
              </div>
              <div className="admin-choice">
                <label>
                  <input
                    type="radio"
                    name={`project-image-mode-${index}`}
                    checked={item.mode === 'upload'}
                    disabled={busy}
                    onChange={() => update(index, { mode: 'upload' })}
                  />
                  上传文件
                </label>
                <label>
                  <input
                    type="radio"
                    name={`project-image-mode-${index}`}
                    checked={item.mode === 'ai'}
                    disabled={busy}
                    onChange={() => update(index, { mode: 'ai' })}
                  />
                  AI 生成
                </label>
              </div>
              {item.mode === 'ai' ? (
                <div className="admin-image-source">
                  <button
                    type="button"
                    disabled={
                      busy ||
                      !project.title.trim() ||
                      !project.description.trim()
                    }
                    onClick={() => void generate(index)}
                  >
                    {busy
                      ? '生成中…'
                      : item.generatedFor
                        ? '重新生成图片'
                        : '生成项目图片'}
                  </button>
                  <small>
                    {item.src &&
                    item.generatedFor === projectImageInput(project)
                      ? '已对应当前项目信息。'
                      : '保存时会先生成图片。'}{' '}
                    使用 AI 设置中的“项目配置”，生成会使用中转站额度。
                  </small>
                </div>
              ) : (
                <div className="admin-image-source">
                  <label className="admin-file-button">
                    上传项目图片
                    <input
                      type="file"
                      disabled={busy}
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setBusy(true);
                        onWorking(true);
                        try {
                          if (!file.type.startsWith('image/'))
                            throw new Error('请选择图片文件');
                          const result = await upload(file);
                          update(index, { src: result.url, generatedFor: '' });
                          setMessage('上传成功，保存后生效。');
                        } catch (error) {
                          setMessage(String(error));
                        } finally {
                          setBusy(false);
                          onWorking(false);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                  <label
                    className="admin-field"
                    htmlFor={`project-image-src-${index}`}
                  >
                    已有素材地址
                    <input
                      id={`project-image-src-${index}`}
                      value={item.src}
                      onChange={(e) =>
                        update(index, { src: e.target.value, generatedFor: '' })
                      }
                    />
                  </label>
                </div>
              )}
              <div className="admin-fields">
                {(['label', 'alt'] as const).map((key) => (
                  <div className="admin-field" key={key}>
                    <label htmlFor={`project-image-${key}-${index}`}>
                      {key === 'label' ? '图片标题' : '替代文本'}
                    </label>
                    <input
                      id={`project-image-${key}-${index}`}
                      value={item[key]}
                      onChange={(e) => update(index, { [key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
      <output className="admin-help">{message}</output>
    </section>
  );
}
