'use client';
import { useState } from 'react';
import type { Json } from '@/lib/cms-validation';
import type { Content, Section } from '@/lib/cms-defaults';

type ApiData = {
  error?: string;
  content: Content;
  revisions: Partial<Record<Section, number>>;
  revision: number;
  authenticated: boolean;
  configured: boolean;
  url: string;
  name: string;
  files: { url: string; name: string; size: number }[];
  cursor: string | null;
};

const names: Record<string, string> = {
  title: '标题',
  name: '名称',
  description: '说明',
  excerpt: '摘要',
  body: '正文（Markdown）',
  date: '日期',
  label: '标签 / 栏目',
  meta: '阅读时长',
  tag: '标签',
  category: '分类',
  cover: '封面地址',
  slug: '文章路径标识',
  id: '唯一标识',
  text: '文字',
  topic: '话题',
  reactions: '互动说明',
  replies: '展示回复',
  images: '图片',
  src: '素材地址',
  alt: '图片描述',
  _published: '发布到前台',
  status: '内容状态',
  subtitle: '副标题',
  number: '编号',
  year: '年份',
  role: '工作范围',
  tags: '标签',
  question: '起点问题',
  decisions: '设计选择',
  steps: '过程步骤',
  next: '下一步',
  wechat: '微信号',
  email: '邮箱',
  publicAccountQr: '公众号二维码',
  serviceUrl: '服务网址',
  platforms: '平台入口',
  url: '网址',
  initials: '头像文字',
  author: '作者',
  color: '书封颜色',
  note: '笔记',
  ids: '关联书籍 ID',
  artist: '音乐作者',
  duration: '时长（秒）',
  mood: '场景',
  english: '英文标题',
  intro: '简介',
  feature: '重点标题',
  action: '展开按钮文字',
  entries: '内容条目',
  sections: '主题分组',
  kind: '类型',
  summary: '摘要',
  paragraphs: '正文段落',
  href: '链接地址',
  link: '链接文字',
  width: '宽度',
  height: '高度',
  position: '图片取景位置',
  mark: '站点标记',
  footer: '页脚文字',
  copyright: '版权文字',
  footerLink: '页脚链接文字',
  footerUrl: '页脚链接地址',
  links: '主导航',
  sites: '网站导航',
  life: '生活导航',
  eyebrow: '眉题',
  noteTitle: '说说区标题',
  noteText: '说说区说明',
};
export const asJson = (value: unknown) => value as Json;
export function titleOf(value: Json, index: number) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const title = [value.title, value.name, value.topic, value.label].find(
      (item) => typeof item === 'string' && item,
    );
    return typeof title === 'string' ? title : `条目 ${index + 1}`;
  }
  return typeof value === 'string'
    ? value.slice(0, 40) || `条目 ${index + 1}`
    : `条目 ${index + 1}`;
}
export function fresh(sample: Json): Json {
  if (Array.isArray(sample)) return [];
  if (sample && typeof sample === 'object')
    return Object.fromEntries(
      Object.entries(sample).map(([key, value]) => [
        key,
        key === '_published'
          ? false
          : key === 'id' || key === 'slug'
            ? `new-${crypto.randomUUID().slice(0, 8)}`
            : key === 'title' || key === 'name'
              ? '未命名内容'
              : Array.isArray(value)
                ? key === 'images'
                  ? structuredClone(value)
                  : []
                : value && typeof value === 'object'
                  ? fresh(value)
                  : ['color', 'src', 'cover', 'image', 'date'].includes(key)
                    ? value
                    : typeof value === 'string'
                      ? ''
                      : value,
      ]),
    );
  return typeof sample === 'string' ? '' : structuredClone(sample);
}
export async function api<T = ApiData>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(path, { ...options, cache: 'no-store' });
  const data = (await response.json()) as ApiData;
  if (!response.ok) throw new Error(data.error || '请求失败，请重试');
  return data as unknown as T;
}

async function compressImage(file: File) {
  if (
    !file.type.startsWith('image/') ||
    typeof createImageBitmap !== 'function'
  )
    return file;
  const bitmap = await createImageBitmap(file);
  try {
    const maxDimension = 2400;
    const scale = Math.min(
      1,
      maxDimension / Math.max(bitmap.width, bitmap.height),
    );
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('无法处理图片，请更换浏览器后重试');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) =>
          result ? resolve(result) : reject(new Error('图片压缩失败')),
        'image/webp',
        0.82,
      );
    });
    return new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), {
      type: 'image/webp',
      lastModified: file.lastModified,
    });
  } finally {
    bitmap.close?.();
  }
}
export async function upload(file: File) {
  if (file.size > 20 * 1024 * 1024) throw new Error('文件不能超过 20 MB');
  file = await compressImage(file);
  return api('/api/admin/media', {
    method: 'POST',
    headers: { 'X-File-Name': encodeURIComponent(file.name) },
    body: file,
  });
}
export function download(value: unknown, filename: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Field({
  value,
  sample,
  onChange,
  label,
  path,
}: {
  value: Json;
  sample: Json;
  onChange: (value: Json) => void;
  label: string;
  path: string;
}) {
  const [message, setMessage] = useState('');
  if (Array.isArray(value)) {
    const template = Array.isArray(sample) ? (sample[0] ?? '') : '';
    const move = (index: number, direction: number) => {
      const items = [...value];
      [items[index], items[index + direction]] = [
        items[index + direction],
        items[index],
      ];
      onChange(items);
    };
    return (
      <fieldset className="admin-array">
        <legend>
          {label} <small>{value.length} 项</small>
        </legend>
        {value.map((item, index) => (
          <details key={index} className="admin-nested">
            <summary>{titleOf(item, index)}</summary>
            <div className="admin-row-actions">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                上移
              </button>
              <button
                type="button"
                disabled={index === value.length - 1}
                onClick={() => move(index, 1)}
              >
                下移
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('删除这项内容？保存栏目后生效。'))
                    onChange(value.filter((_, i) => i !== index));
                }}
              >
                删除
              </button>
            </div>
            <Field
              path={`${path}.${index}`}
              label={`第 ${index + 1} 项`}
              sample={template}
              value={item}
              onChange={(next) =>
                onChange(value.map((old, i) => (i === index ? next : old)))
              }
            />
          </details>
        ))}
        <button
          type="button"
          onClick={() => onChange([...value, fresh(template)])}
        >
          ＋ 添加一项
        </button>
      </fieldset>
    );
  }
  if (value && typeof value === 'object') {
    const template =
      sample && typeof sample === 'object' && !Array.isArray(sample)
        ? sample
        : {};
    return (
      <div className="admin-object">
        <h3>{label}</h3>
        <div className="admin-fields">
          {Object.entries(value).map(([key, item]) => (
            <Field
              key={key}
              path={`${path}.${key}`}
              label={names[key] || key}
              sample={template[key] ?? item}
              value={item}
              onChange={(next) => onChange({ ...value, [key]: next })}
            />
          ))}
        </div>
      </div>
    );
  }
  if (typeof value === 'boolean')
    return (
      <label className="admin-check">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
        />
        {label}
        <small>{value ? '保存后公开显示' : '草稿，仅后台可见'}</small>
      </label>
    );
  const field = path.split('.').at(-1)!;
  const asset = /^(src|cover|image|publicAccountQr)$/.test(field);
  const long =
    typeof value === 'string' &&
    ((typeof sample === 'string' &&
      (sample.length > 90 || sample.includes('\n'))) ||
      /body|description|excerpt|text|note|summary|paragraph/.test(field));
  return (
    <div className="admin-field">
      <label htmlFor={path}>{label}</label>
      {long ? (
        <textarea
          id={path}
          rows={field === 'body' ? 18 : 4}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={path}
          type={typeof value === 'number' ? 'number' : 'text'}
          value={String(value ?? '')}
          onChange={(e) =>
            onChange(
              typeof value === 'number'
                ? Number(e.target.value)
                : e.target.value,
            )
          }
        />
      )}
      {field === 'slug' && (
        <small>
          例如 first-post；文章地址为
          /writing/first-post。修改后旧地址不再有效。
        </small>
      )}
      {asset && (
        <div className="admin-asset">
          <label className="admin-file-button">
            上传替换
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,audio/mpeg,audio/wav"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setMessage('上传中…');
                try {
                  const result = await upload(file);
                  onChange(result.url);
                  setMessage('已上传，请保存栏目。');
                } catch (error) {
                  setMessage(String(error));
                }
                e.target.value = '';
              }}
            />
          </label>
          {typeof value === 'string' && /^(\/|https?:)/.test(value) && (
            <a href={value} target="_blank" rel="noreferrer">
              查看素材 ↗
            </a>
          )}
          <output>{message}</output>
        </div>
      )}
    </div>
  );
}

export function MediaLibrary() {
  const [files, setFiles] = useState<
    { url: string; name: string; size: number }[]
  >([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [loaded, setLoaded] = useState(false);
  async function load(next?: string) {
    try {
      const data = await api(
        `/api/admin/media${next ? `?cursor=${encodeURIComponent(next)}` : ''}`,
      );
      setFiles((previous) =>
        next ? [...previous, ...data.files] : data.files,
      );
      setCursor(data.cursor);
      setLoaded(true);
    } catch (error) {
      setMessage(String(error));
    }
  }
  return (
    <section className="admin-media">
      <h2>素材库</h2>
      <p>
        上传图片或音乐，再将地址填入对应栏目。单文件最大 20
        MB。素材上传后即可通过地址访问；草稿内容请勿使用保密素材。
      </p>
      <button type="button" onClick={() => void load()}>
        {loaded ? '刷新素材列表' : '查看已有素材'}
      </button>{' '}
      <label className="admin-file-button">
        上传素材
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,audio/mpeg,audio/wav"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setMessage('上传中…');
            try {
              await upload(file);
              await load();
              setMessage('上传完成');
            } catch (error) {
              setMessage(String(error));
            }
            e.target.value = '';
          }}
        />
      </label>
      <output>{message}</output>
      <div className="admin-media-list">
        {files.map((file) => (
          <article key={file.url}>
            <a href={file.url} target="_blank" rel="noreferrer">
              {file.name} ↗
            </a>
            <small>{Math.round(file.size / 1024)} KB</small>
            <input
              readOnly
              aria-label={`${file.name}地址`}
              value={file.url}
              onFocus={(e) => e.target.select()}
            />
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(file.url);
                  setMessage('地址已复制');
                } catch {
                  setMessage('请选中地址并手动复制');
                }
              }}
            >
              复制地址
            </button>
          </article>
        ))}
      </div>
      {cursor && (
        <button type="button" onClick={() => void load(cursor)}>
          加载更多
        </button>
      )}
    </section>
  );
}
