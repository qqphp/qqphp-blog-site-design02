'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Tabs } from '@base-ui/react/tabs';
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  Copy,
  FileCode2,
  Search,
  Terminal,
  X,
} from 'lucide-react';
import { useContent } from './content-provider';
import {
  aiPlans,
  aiRelays,
  aiResourceDate,
  aiSkills,
} from '@/lib/ai-resources';
import './ai-notebook.css';

function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle');
  return (
    <div className="ai-copy-control">
      <button
        type="button"
        className="ai-text-button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setState('copied');
          } catch {
            setState('error');
          }
        }}
      >
        {state === 'copied' ? <Check size={15} /> : <Copy size={15} />}
        {state === 'copied' ? `${label} · 已复制` : label}
      </button>
      <output>
        {state === 'error'
          ? '复制失败，请展开内容手动复制。'
          : state === 'copied'
            ? '已复制到剪贴板。'
            : ''}
      </output>
    </div>
  );
}

function SectionHeading({
  number,
  english,
  title,
  description,
  count,
}: {
  number: string;
  english: string;
  title: string;
  description: string;
  count: number;
}) {
  return (
    <header className="ai-section-heading">
      <div className="ai-section-label">
        <span>{number}</span>
        <p>{english}</p>
      </div>
      <div>
        <h2>
          {title}
          <small>{String(count).padStart(2, '0')}</small>
        </h2>
        <p>{description}</p>
      </div>
    </header>
  );
}

export function AiNotebook() {
  const { aiNotes, prompt } = useContent();
  const [active, setActive] = useState('ai-journal');
  function choose(value: string) {
    setActive(value);
    setQuery('');
    setFilter('全部');
    setPlanKind('全部方案');
  }
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('全部');
  const [planKind, setPlanKind] = useState('全部方案');
  const search = query.trim().toLocaleLowerCase();
  const matches = (values: string[]) =>
    values.join(' ').toLocaleLowerCase().includes(search);
  const notes = aiNotes.filter(
    (note) =>
      (filter === '全部' || note.kind === filter) &&
      matches([note.title, note.summary, note.kind, ...note.paragraphs]),
  );
  const skills = aiSkills.filter((skill) =>
    matches([
      skill.name,
      skill.title,
      skill.category,
      skill.description,
      skill.scenario,
    ]),
  );
  const relays = aiRelays.filter((relay) =>
    matches([relay.name, relay.category, relay.description, ...relay.features]),
  );
  const plans = aiPlans.filter(
    (plan) =>
      (planKind === '全部方案' || plan.kind === planKind) &&
      matches([plan.name, plan.provider, plan.kind, plan.description]),
  );
  const navigation = [
    {
      id: 'ai-journal',
      name: 'AI资讯',
      en: 'AI NEWS',
      count: aiNotes.length,
      results: notes.length,
    },
    {
      id: 'ai-skills',
      name: 'Skills 工具箱',
      en: 'REUSABLE METHODS',
      count: aiSkills.length,
      results: skills.length,
    },
    {
      id: 'ai-relays',
      name: '中转站',
      en: 'MODEL CONNECTIONS',
      count: aiRelays.length,
      results: relays.length,
    },
    {
      id: 'ai-plans',
      name: 'Token Plan',
      en: 'USAGE & PLANS',
      count: aiPlans.length,
      results: plans.length,
    },
  ];
  const current = navigation.find((item) => item.id === active)!;
  return (
    <Tabs.Root
      className="ai-notebook"
      value={active}
      onValueChange={(value) => choose(String(value))}
    >
      <header className="ai-field-header">
        <p className="ai-eyebrow">
          <span className="ai-status-dot" />
          ALEI / AI FIELD NOTES
        </p>
        <span>观察 · 实践 · 留下方法</span>
      </header>
      <section className="ai-field-hero" aria-labelledby="ai-page-title">
        <div className="ai-hero-copy">
          <p className="ai-eyebrow">一个持续生长的 AI 实验档案</p>
          <h1 id="ai-page-title">
            与 AI 一起，
            <br />
            把想法<span>向前推进。</span>
          </h1>
          <p className="ai-hero-description">
            记录值得留下的文字，收集可复用的 Skills，
            <br className="ai-desktop-break" />
            也聊聊模型的入口与每一份 Token 的去向。
          </p>
          <a
            className="ai-primary-link"
            href="#ai-content"
            onClick={() => choose('ai-journal')}
          >
            浏览AI资讯 <ArrowDown size={16} />
          </a>
        </div>
        <div className="ai-hero-field">
          <div className="ai-field-meta">
            <span>HUMAN × MACHINE</span>
            <span>探索进行时</span>
          </div>
          <div className="ai-type-study" aria-hidden="true">
            AI<span>+</span>
          </div>
          <p className="ai-field-caption">
            好奇心是输入，
            <br />
            自己的判断是最后一步。
          </p>
          <ol className="ai-process" aria-label="AI 实践路径">
            <li>
              想法 <span>01</span>
            </li>
            <li>
              方法 <span>02</span>
            </li>
            <li>
              模型 <span>03</span>
            </li>
            <li>
              验证 <span>04</span>
            </li>
          </ol>
        </div>
      </section>
      <Tabs.List className="ai-index" aria-label="AI 栏目切换">
        {navigation.map((item, index) => (
          <Tabs.Tab value={item.id} key={item.id} aria-label={item.name}>
            <span className="ai-index-top">
              0{index + 1}
              <ArrowUpRight size={16} />
            </span>
            <strong>
              {item.name}
              <small>{String(item.count).padStart(2, '0')}</small>
            </strong>
            <span className="ai-index-en">{item.en}</span>
          </Tabs.Tab>
        ))}
      </Tabs.List>
      <div id="ai-content" className="ai-collection-toolbar">
        <p>
          <span className="ai-status-dot" />
          {current.name} · 共 {current.count} 条内容
          <span className="ai-toolbar-aside"> / 保持好奇，持续记录</span>
        </p>
        <div className="ai-search">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            aria-label={`搜索${current.name}`}
            placeholder={`搜索${current.name}…`}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setFilter('全部');
              setPlanKind('全部方案');
            }}
          />
          {query && (
            <button
              type="button"
              aria-label="清空 AI 搜索"
              onClick={() => setQuery('')}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
      {search && (
        <output className="ai-search-result">
          “{query}” 找到 {current.results} 条内容{' '}
          <button
            type="button"
            className="ai-text-button"
            onClick={() => setQuery('')}
          >
            清空搜索
          </button>
        </output>
      )}

      <Tabs.Panel value="ai-journal">
        <section id="ai-journal" className="ai-section" aria-label="AI资讯">
          <SectionHeading
            number="01"
            english="AI NEWS"
            title="AI资讯"
            description="收集 AI 的新发现，也留下实践中的观察与思考。"
            count={notes.length}
          />
          <div className="ai-note-filters" aria-label="资讯类型">
            {['全部', ...new Set(aiNotes.map((note) => note.kind))].map(
              (kind) => (
                <button
                  key={kind}
                  type="button"
                  aria-pressed={filter === kind}
                  onClick={() => setFilter(kind)}
                >
                  {kind}
                </button>
              ),
            )}
          </div>
          <div className="ai-journal-layout">
            <div className="ai-journal-entries">
              {notes.map((note, index) => (
                <article
                  id={`ai-note-${note.id}`}
                  className={`ai-journal-entry${index === 0 ? ' ai-entry-featured' : ''}`}
                  key={note.id}
                >
                  <div className="ai-entry-meta">
                    <span>{note.kind}</span>
                    <small>{note.status}</small>
                    <span className="ai-entry-number">
                      {String(aiNotes.indexOf(note) + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3>{note.title}</h3>
                  <p>{note.summary}</p>
                  <details>
                    <summary>
                      展开阅读{' '}
                      <span className="ai-expand-mark" aria-hidden="true">
                        +
                      </span>
                    </summary>
                    <div className="ai-entry-prose">
                      {note.paragraphs.map((paragraph, i) => (
                        <p key={i}>{paragraph}</p>
                      ))}
                      {note.href && (
                        <Link href={note.href}>
                          {note.link} <ArrowUpRight size={15} />
                        </Link>
                      )}
                    </div>
                  </details>
                </article>
              ))}
              {!notes.length && (
                <p className="ai-empty">
                  {aiNotes.length
                    ? '没有匹配的资讯，试试其他关键词或类型。'
                    : '还没有公开资讯，新的发现会出现在这里。'}
                </p>
              )}
            </div>
            <aside className="ai-prompt-card" aria-label="提示词便签">
              <div className="ai-prompt-top">
                <Terminal size={19} />
                <span>PROMPT / 001</span>
              </div>
              <p className="ai-eyebrow">随手带走一个方法</p>
              <h3>
                好问题，
                <br />
                从具体开始。
              </h3>
              <p>把模糊的“帮我做一下”，拆成目标、材料和验收方式。</p>
              <div className="ai-prompt-outline">
                <span>01 / 我想解决什么</span>
                <span>02 / 我已经有什么</span>
                <span>03 / 怎样才算完成</span>
              </div>
              <details>
                <summary>
                  查看完整提示词
                  <span className="ai-expand-mark" aria-hidden="true">
                    +
                  </span>
                </summary>
                <pre>{prompt.text}</pre>
              </details>
              <CopyButton text={prompt.text} label="复制提示词" />
              <span className="ai-prompt-foot">保留事实，把判断留给自己。</span>
            </aside>
          </div>
        </section>
      </Tabs.Panel>

      <Tabs.Panel value="ai-skills">
        <section
          id="ai-skills"
          className="ai-section"
          aria-label="Skills 工具箱"
        >
          <SectionHeading
            number="02"
            english="REUSABLE METHODS"
            title="Skills 工具箱"
            description="把好用的方法装进文件，让下一次少解释一点。"
            count={skills.length}
          />
          <div className="ai-skill-grid">
            {skills.map((skill, index) => (
              <article className="ai-skill-card" key={skill.id}>
                <div className="ai-skill-file">
                  <FileCode2 size={18} />
                  <span>{skill.name} /</span>
                  <small>SKILL.md</small>
                </div>
                <div className="ai-skill-body">
                  <div className="ai-skill-meta">
                    <span>{skill.category}</span>
                    <span>0{index + 1}</span>
                  </div>
                  <h3>{skill.title}</h3>
                  <p>{skill.description}</p>
                  <dl>
                    <div>
                      <dt>输入</dt>
                      <dd>{skill.input}</dd>
                    </div>
                    <div>
                      <dt>带走</dt>
                      <dd>{skill.output}</dd>
                    </div>
                  </dl>
                  <details>
                    <summary>
                      怎么用
                      <span className="ai-expand-mark" aria-hidden="true">
                        +
                      </span>
                    </summary>
                    <div className="ai-skill-guide">
                      <p>{skill.scenario}</p>
                      <p>{skill.note}</p>
                      <small>安装对应 Skill 后，可使用这段示例指令：</small>
                      <pre>{skill.prompt}</pre>
                      <CopyButton
                        text={skill.prompt}
                        label={`复制 ${skill.name} 指令`}
                      />
                    </div>
                  </details>
                  <a
                    className="ai-resource-link"
                    href={skill.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    查看官方 Skill <ArrowUpRight size={16} />
                  </a>
                </div>
              </article>
            ))}
          </div>
          {!skills.length && (
            <p className="ai-empty">没有匹配的 Skill，换个关键词试试。</p>
          )}
          <p className="ai-source-note">
            收录自 Anthropic 官方技能库 · 使用指令为本站示例 ·
            适配环境与依赖见原仓库
          </p>
        </section>
      </Tabs.Panel>

      <Tabs.Panel value="ai-relays">
        <section id="ai-relays" className="ai-section" aria-label="中转站">
          <SectionHeading
            number="03"
            english="MODEL CONNECTIONS"
            title="中转站"
            description="从一个入口，连接更多模型。把接入方式与用途放在一起看。"
            count={relays.length}
          />
          <div className="ai-relay-directory">
            <div className="ai-relay-columns" aria-hidden="true">
              <span>平台 / PLATFORM</span>
              <span>能力与用途</span>
              <span>接入资料</span>
            </div>
            {relays.map((relay) => (
              <article className="ai-relay-row" key={relay.id}>
                <div className="ai-relay-identity">
                  <span className="ai-platform-mark" aria-hidden="true">
                    {relay.mark}
                  </span>
                  <div>
                    <span className="ai-relay-category">{relay.category}</span>
                    <h3>{relay.name}</h3>
                    <small>官方资料收录</small>
                  </div>
                </div>
                <div className="ai-relay-description">
                  <p>{relay.description}</p>
                  <div className="ai-resource-tags">
                    {relay.features.map((feature) => (
                      <span key={feature}>{feature}</span>
                    ))}
                  </div>
                  <small>{relay.focus}</small>
                </div>
                <div className="ai-relay-actions">
                  <a
                    className="ai-resource-link"
                    href={relay.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    接入文档 <ArrowUpRight size={16} />
                  </a>
                  <details>
                    <summary>
                      API 地址{' '}
                      <span className="ai-expand-mark" aria-hidden="true">
                        +
                      </span>
                    </summary>
                    <pre>{relay.endpoint}</pre>
                    <CopyButton
                      text={relay.endpoint}
                      label={`复制 ${relay.name} 地址`}
                    />
                  </details>
                </div>
              </article>
            ))}
            {!relays.length && (
              <p className="ai-empty">没有匹配的平台，换个关键词试试。</p>
            )}
          </div>
          <p className="ai-source-note">
            按公开文档整理，尚未附个人实测；可用模型、费用与数据政策请查看各平台说明。
          </p>
        </section>
      </Tabs.Panel>

      <Tabs.Panel value="ai-plans">
        <section id="ai-plans" className="ai-section" aria-label="Token Plan">
          <SectionHeading
            number="04"
            english="USAGE & PLANS"
            title="Token Plan"
            description="先看用在哪里，再看怎样付费。留一份能对照的方案档案。"
            count={plans.length}
          />
          <div className="ai-plan-toolbar">
            <div className="ai-note-filters" aria-label="方案类型">
              {['全部方案', '开发订阅', 'API 按量'].map((kind) => (
                <button
                  type="button"
                  key={kind}
                  aria-pressed={planKind === kind}
                  onClick={() => setPlanKind(kind)}
                >
                  {kind}
                </button>
              ))}
            </div>
            <span>
              资料核对{' '}
              <time dateTime={aiResourceDate}>
                {aiResourceDate.replaceAll('-', '.')}
              </time>
            </span>
          </div>
          <div className="ai-plan-grid">
            {plans.map((plan) => (
              <article className="ai-plan-card" key={plan.id}>
                <div className="ai-plan-top">
                  <span>{plan.provider}</span>
                  <span>{plan.kind}</span>
                </div>
                <h3>{plan.name}</h3>
                <p className="ai-plan-price">
                  {plan.price}
                  <small>{plan.unit}</small>
                </p>
                <p className="ai-plan-description">{plan.description}</p>
                <dl>
                  <div>
                    <dt>使用范围</dt>
                    <dd>{plan.scope}</dd>
                  </div>
                  <div>
                    <dt>额度方式</dt>
                    <dd>{plan.allowance}</dd>
                  </div>
                  <div>
                    <dt>计费方式</dt>
                    <dd>{plan.billing}</dd>
                  </div>
                </dl>
                <p className="ai-plan-note">{plan.note}</p>
                <a
                  className="ai-resource-link"
                  href={plan.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  查看官方方案 <ArrowUpRight size={16} />
                </a>
              </article>
            ))}
          </div>
          {!plans.length && (
            <p className="ai-empty">
              当前条件下没有方案，试试其他关键词或方案类型。
            </p>
          )}
          <div className="ai-plan-footnote">
            <span>读懂一份 PLAN</span>
            <p>
              订阅额度与 API Token
              的计费单位不同，不能直接按月费比较。价格为核对时的美元月付标价，未含税；最新价格与限额以各卡片的官方页面为准。
            </p>
          </div>
        </section>
      </Tabs.Panel>
      <footer className="ai-field-footer">
        <div>
          <span className="ai-status-dot" />
          <p>下一次发现，也会留在这里。</p>
        </div>
        <a href="#ai-page-title">回到开头 ↑</a>
      </footer>
    </Tabs.Root>
  );
}
