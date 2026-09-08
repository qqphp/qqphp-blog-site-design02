import { bindings, getDocuments } from './cms-server';
import { readLimitedBody } from './admin-auth';
import { validateProviderUrl } from './cms-validation';
import { projectImageInput } from './project-content';
import { coverInput } from './article-categories';

function aiFetch(url: string | URL, init: RequestInit) {
  const { LOCAL_AI_TRANSPORT, LOCAL_AI_TOKEN } = bindings();
  if (!LOCAL_AI_TRANSPORT || !LOCAL_AI_TOKEN) return fetch(url, init);
  const headers = new Headers(init.headers);
  headers.set('X-Local-Ai-Token', LOCAL_AI_TOKEN);
  headers.set('X-Local-Ai-Target', String(url));
  return fetch(LOCAL_AI_TRANSPORT, { ...init, headers });
}

export async function providerRequest(path: string, body?: unknown) {
  const { content } = await getDocuments();
  const key = bindings().TEAMOROUTER_KEY?.trim();
  if (!key)
    throw new Error('未配置 TEAMOROUTER_KEY，请填写 .dev.vars 并重启服务。');
  const base = validateProviderUrl(content.aiSettings.baseUrl).href.replace(
    /\/$/,
    '',
  );
  let response: Response;
  try {
    response = await aiFetch(`${base}/${path}`, {
      method: body ? 'POST' : 'GET',
      redirect: 'manual',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(
        path === 'images/generations' ? 300000 : 45000,
      ),
    });
  } catch {
    throw new Error(
      '中转站连接失败或超时，请检查网络和 API 地址。图片生成不自动重试，以免重复计费。',
    );
  }
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(
      `中转站返回 ${response.status}。${[401, 403].includes(response.status) ? '请检查密钥和模型权限。' : response.status === 429 ? '请求受限或额度不足，请检查中转站账户。' : '请检查模型名称、服务状态和账户额度。'}`,
    );
  }
  return JSON.parse(
    new TextDecoder().decode(await readLimitedBody(response, 30 * 1024 * 1024)),
  ) as {
    data?: { id?: string; b64_json?: string; url?: string }[];
    choices?: { message?: { content?: string } }[];
  };
}

export function buildCoverPrompt(
  template: string,
  title: string,
  excerpt: string,
  style: string,
  subtitle = '',
) {
  const values: Record<string, string> = {
    title: title.trim(),
    excerpt: excerpt.trim(),
    style,
    subtitle: subtitle.trim(),
  };
  return template.replace(
    /\{\{(title|excerpt|style|subtitle)\}\}/g,
    (_, key: string) => values[key],
  );
}

export async function generateCover(
  title: string,
  excerpt: string,
  projectSubtitle?: string,
  storyImage = false,
) {
  const { content } = await getDocuments();
  const settings = content.aiSettings;
  const prompt = buildCoverPrompt(
    storyImage
      ? '为这条个人博客说说创作一张配图。话题：{{title}}。正文：{{excerpt}}。根据正文的情绪与场景构图，不添加文字、水印或虚构截图。'
      : projectSubtitle === undefined
        ? settings.coverPrompt
        : settings.projectImagePrompt,
    title,
    excerpt,
    projectSubtitle === undefined
      ? settings.coverStyle
      : settings.projectImageStyle,
    projectSubtitle,
  );
  const result = await providerRequest('images/generations', {
    model: settings.imageModel,
    prompt,
    n: 1,
  });
  const first = result.data?.[0];
  let bytes: Uint8Array;
  if (first?.b64_json) {
    if (
      first.b64_json.length > 28 * 1024 * 1024 ||
      !/^[A-Za-z0-9+/=\r\n]+$/.test(first.b64_json)
    )
      throw new Error('图片数据无效或超过 20 MB。');
    try {
      bytes = Uint8Array.from(atob(first.b64_json), (char) =>
        char.charCodeAt(0),
      );
    } catch {
      throw new Error('图片编码无效。');
    }
  } else if (first?.url) {
    const url = validateProviderUrl(first.url, true);
    const response = await aiFetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(45000),
    });
    if (!response.ok) throw new Error('生成成功，但下载图片失败，请稍后重试。');
    bytes = await readLimitedBody(response, 20 * 1024 * 1024);
  } else
    throw new Error(
      '中转站未返回图片，请确认所选模型支持 images/generations。',
    );
  if (!bytes.length || bytes.length > 20 * 1024 * 1024)
    throw new Error('生成图片超过大小限制。');
  const ascii = (start: number, end: number) =>
    String.fromCharCode(...bytes.slice(start, end));
  const format =
    bytes[0] === 137 && ascii(1, 4) === 'PNG'
      ? ['png', 'image/png']
      : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        ? ['jpg', 'image/jpeg']
        : ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP'
          ? ['webp', 'image/webp']
          : null;
  if (!format)
    throw new Error('模型返回的图片格式不受支持，请使用 PNG、JPEG 或 WebP。');
  const key = `${crypto.randomUUID()}.${format[0]}`;
  await bindings().MEDIA.put(key, bytes, {
    httpMetadata: { contentType: format[1] },
    customMetadata: { name: `${title.slice(0, 80)} · AI封面`, source: 'ai' },
  });
  return {
    url: `/api/media/${key}`,
    generatedFor:
      projectSubtitle === undefined
        ? coverInput(title, excerpt)
        : projectImageInput({
            title,
            subtitle: projectSubtitle,
            description: excerpt,
          }),
  };
}
