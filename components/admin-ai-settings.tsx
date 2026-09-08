'use client';
import { useEffect, useState } from 'react';
import type { Content } from '@/lib/cms-defaults';
import { Tabs } from '@base-ui/react/tabs';
import { AdminModelSelect } from './admin-model-select';
import { api } from './admin-fields';

export function AdminAiSettings({
  value,
  onChange,
  dirty,
}: {
  value: Content['aiSettings'];
  onChange: (value: Content['aiSettings']) => void;
  dirty: boolean;
}) {
  const [keyConfigured, setKeyConfigured] = useState<boolean | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [working, setWorking] = useState(false);
  useEffect(() => {
    void api<{ keyConfigured: boolean }>('/api/admin/ai')
      .then((result) => setKeyConfigured(result.keyConfigured))
      .catch(() => setMessage('无法读取密钥状态，请重新登录。'));
  }, []);
  async function check(action: 'models' | 'test') {
    setWorking(true);
    setMessage('正在连接中转站…');
    try {
      const result = await api<{ models?: string[]; message?: string }>(
        '/api/admin/ai',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        },
      );
      if (result.models) setModels(result.models);
      setMessage(
        result.message ||
          `连接成功，获取到 ${result.models?.length ?? 0} 个模型。`,
      );
    } catch (error) {
      setMessage(String(error));
    } finally {
      setWorking(false);
    }
  }
  return (
    <Tabs.Root defaultValue="models" className="admin-ai-settings">
      <Tabs.List className="admin-settings-tabs" aria-label="AI 功能配置">
        <Tabs.Tab value="models">模型配置</Tabs.Tab>
        <Tabs.Tab value="writing">写作配置</Tabs.Tab>
        <Tabs.Tab value="projects">项目配置</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="models">
        <div className="admin-ai-status">
          <strong>OpenAI 兼容接口</strong>
          <span>
            {keyConfigured === null
              ? '正在读取密钥状态…'
              : keyConfigured
                ? 'TEAMOROUTER_KEY 已配置'
                : 'TEAMOROUTER_KEY 未配置'}
          </span>
        </div>
        <p>
          密钥从服务端 .dev.vars
          读取，不会显示在后台或内容备份中。更改密钥后需要重启服务。
        </p>
        <div className="admin-fields">
          <div className="admin-field admin-wide">
            <label htmlFor="ai-base-url">API Base URL</label>
            <input
              id="ai-base-url"
              value={value.baseUrl}
              onChange={(e) => onChange({ ...value, baseUrl: e.target.value })}
            />
            <small>
              填写包含 /v1 的接口根地址。更换中转站时，请同时替换
              TEAMOROUTER_KEY；密钥会发给这里配置的站点。
            </small>
          </div>
          {(
            [
              ['textModel', '文本模型'],
              ['imageModel', '图片模型'],
            ] as const
          ).map(([key, label]) => (
            <div className="admin-field" key={key}>
              <label htmlFor={`ai-${key}`}>{label}</label>
              <AdminModelSelect
                id={`ai-${key}`}
                label={label}
                value={value[key]}
                models={models}
                onChange={(model) => onChange({ ...value, [key]: model })}
              />
            </div>
          ))}
          <div className="admin-ai-checks admin-wide">
            <button
              type="button"
              disabled={working || dirty || !keyConfigured}
              onClick={() => void check('models')}
            >
              获取模型列表
            </button>
            <button
              type="button"
              disabled={working || dirty || !keyConfigured}
              onClick={() => void check('test')}
            >
              测试文本模型
            </button>
            <small>
              {dirty
                ? '请先保存设置，再测试连接。'
                : '模型列表用于验证连接，文本测试会发送一次简短请求。'}
            </small>
            <output>{message}</output>
          </div>
        </div>
      </Tabs.Panel>
      <Tabs.Panel value="writing">
        <div className="admin-section-heading">
          <div>
            <h2>文章封面生成</h2>
            <p className="admin-help">
              根据标题、摘要和以下风格生成封面。模型在“模型配置”中选择。
            </p>
          </div>
        </div>
        <div className="admin-fields">
          <div className="admin-field admin-wide">
            <label htmlFor="ai-cover-style">文章封面风格</label>
            <textarea
              id="ai-cover-style"
              rows={3}
              value={value.coverStyle}
              onChange={(e) =>
                onChange({ ...value, coverStyle: e.target.value })
              }
            />
          </div>
          <div className="admin-field admin-wide">
            <label htmlFor="ai-cover-prompt">文章封面图片生成提示词</label>
            <textarea
              id="ai-cover-prompt"
              rows={11}
              value={value.coverPrompt}
              onChange={(e) =>
                onChange({ ...value, coverPrompt: e.target.value })
              }
            />
            <small>
              {
                '{{title}} = 文章标题；{{excerpt}} = 文章摘要；{{style}} = 上方封面风格。标题和摘要占位符必须保留。'
              }
            </small>
          </div>
        </div>
        <p>
          封面通过 /images/generations 生成，支持返回 Base64 图片或 HTTPS
          图片地址。生成后自动存入本地素材库；失败不替换原封面，也不自动重试。
        </p>
      </Tabs.Panel>
      <Tabs.Panel value="projects">
        <div className="admin-section-heading">
          <div>
            <h2>项目图片生成</h2>
            <p className="admin-help">
              使用“模型配置”中的图片模型，根据项目名称、副标题和摘要生成图片。
            </p>
          </div>
        </div>
        <div className="admin-fields">
          <div className="admin-field admin-wide">
            <label htmlFor="ai-project-style">项目图片风格</label>
            <textarea
              id="ai-project-style"
              rows={3}
              value={value.projectImageStyle}
              onChange={(e) =>
                onChange({ ...value, projectImageStyle: e.target.value })
              }
            />
          </div>
          <div className="admin-field admin-wide">
            <label htmlFor="ai-project-prompt">项目图片生成提示词</label>
            <textarea
              id="ai-project-prompt"
              rows={11}
              value={value.projectImagePrompt}
              onChange={(e) =>
                onChange({ ...value, projectImagePrompt: e.target.value })
              }
            />
            <small>
              {
                '{{title}} = 项目名称；{{subtitle}} = 副标题；{{excerpt}} = 摘要；{{style}} = 图片风格。前三个占位符必须保留。'
              }
            </small>
          </div>
        </div>
      </Tabs.Panel>
    </Tabs.Root>
  );
}
