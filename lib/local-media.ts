import { bindings } from './cms-server';

export type LocalMediaFile = {
  key: string;
  name: string;
  size: number;
};

function mediaConfig() {
  const { LOCAL_MEDIA_STORAGE, LOCAL_MEDIA_TOKEN } = bindings();
  if (!LOCAL_MEDIA_STORAGE || !LOCAL_MEDIA_TOKEN)
    throw new Error('本地素材存储未启动，请重启开发服务。');
  return {
    base: LOCAL_MEDIA_STORAGE.replace(/\/$/, ''),
    token: LOCAL_MEDIA_TOKEN,
  };
}

async function mediaRequest(path: string, init: RequestInit = {}) {
  const { base, token } = mediaConfig();
  const headers = new Headers(init.headers);
  headers.set('X-Local-Media-Token', token);
  try {
    return await fetch(`${base}${path}`, { ...init, headers });
  } catch {
    throw new Error('本地素材存储连接失败，请重启开发服务。');
  }
}

export async function listLocalMedia(cursor?: string) {
  const response = await mediaRequest(
    `/media${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`,
  );
  if (!response.ok) throw new Error('读取本地素材库失败。');
  return (await response.json()) as {
    files: LocalMediaFile[];
    cursor: string | null;
  };
}

export async function saveLocalMedia(
  key: string,
  data: Uint8Array,
  metadata: { contentType: string; name: string; source?: 'ai' | 'upload' },
) {
  const response = await mediaRequest(`/media/${key}`, {
    method: 'PUT',
    headers: {
      'Content-Type': metadata.contentType,
      'X-Media-Name': encodeURIComponent(metadata.name),
      'X-Media-Source': metadata.source || 'upload',
    },
    body: data as BodyInit,
  });
  if (!response.ok) throw new Error('保存文件到本地素材库失败。');
}

export function readLocalMedia(key: string, requestHeaders: Headers) {
  const headers = new Headers();
  for (const name of ['range', 'if-none-match']) {
    const value = requestHeaders.get(name);
    if (value) headers.set(name, value);
  }
  return mediaRequest(`/media/${key}`, { headers }).then((response) => {
    if (![200, 206, 304, 404, 416].includes(response.status))
      throw new Error('读取本地素材失败。');
    return response;
  });
}
