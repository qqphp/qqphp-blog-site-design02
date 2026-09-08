import {
  authenticated,
  json,
  sameOrigin,
  readLimitedBody,
} from '@/lib/admin-auth';
import { bindings, getDocuments } from '@/lib/cms-server';
import { generateCover, providerRequest } from '@/lib/ai-provider';

export async function GET(request: Request) {
  if (!(await authenticated(request))) return json({ error: '请先登录' }, 401);
  return json({ keyConfigured: Boolean(bindings().TEAMOROUTER_KEY?.trim()) });
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: '请求来源无效' }, 403);
  if (!(await authenticated(request))) return json({ error: '请先登录' }, 401);
  let body: {
    action?: string;
    title?: string;
    excerpt?: string;
    subtitle?: string;
  };
  try {
    body = JSON.parse(
      new TextDecoder().decode(await readLimitedBody(request, 32000)),
    );
  } catch {
    return json({ error: '请求格式无效' }, 400);
  }
  if (
    !body ||
    !['models', 'test', 'cover', 'project-cover', 'story-image'].includes(
      body.action || '',
    )
  )
    return json({ error: '操作无效' }, 400);
  if (
    (body.action === 'cover' ||
      body.action === 'project-cover' ||
      body.action === 'story-image') &&
    (typeof body.title !== 'string' ||
      !body.title.trim() ||
      body.title.length > 500 ||
      typeof body.excerpt !== 'string' ||
      !body.excerpt.trim() ||
      body.excerpt.length > 5000)
  )
    return json(
      { error: '请先填写标题和摘要（标题最多 500 字，摘要最多 5000 字）。' },
      400,
    );
  if (
    body.action === 'project-cover' &&
    (typeof body.subtitle !== 'string' || body.subtitle.length > 1000)
  )
    return json({ error: '副标题格式无效或超过 1000 字' }, 400);
  try {
    if (body.action === 'models') {
      const result = await providerRequest('models');
      return json({
        models:
          result.data?.flatMap((item) =>
            typeof item.id === 'string' ? [item.id] : [],
          ) ?? [],
      });
    }
    if (body.action === 'test') {
      const { content } = await getDocuments();
      const result = await providerRequest('chat/completions', {
        model: content.aiSettings.textModel,
        messages: [{ role: 'user', content: 'Reply with OK only.' }],
        max_tokens: 16,
      });
      if (!result.choices?.[0]?.message?.content)
        throw new Error('模型未返回文本。');
      return json({ message: '文本模型调用成功。' });
    }
    return json(
      await generateCover(
        body.title!,
        body.excerpt!,
        body.action === 'project-cover' ? body.subtitle : undefined,
        body.action === 'story-image',
      ),
    );
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'AI 请求失败' },
      502,
    );
  }
}
