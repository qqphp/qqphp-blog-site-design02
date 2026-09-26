'use client';

import { useRef, useState, useMemo } from 'react';
import { Tabs } from '@base-ui/react/tabs';
import Image from 'next/image';
import {
  ArrowUpRight,
  Bot,
  ChevronDown,
  Database,
  Network,
  Puzzle,
  Sparkles,
} from 'lucide-react';
import {
  aiAgents,
  aiRelays,
  aiSkills,
} from '@/lib/ai-resources';
import { AiModelDataSection } from '@/components/ai-model-data';
import './ai-notebook.css';

/* ------------------------------------------------------------------ */
/*  Piano (unchanged)                                                  */
/* ------------------------------------------------------------------ */

const PITCHES = [
  'C',
  'C♯',
  'D',
  'D♯',
  'E',
  'F',
  'F♯',
  'G',
  'G♯',
  'A',
  'A♯',
  'B',
] as const;
const BLACK_PITCHES = new Set([1, 3, 6, 8, 10]);

type PianoKey = {
  midi: number;
  name: string;
  pitch: string;
  octave: number;
  frequency: number;
  black: boolean;
  column: number;
};

function pianoKeys(start = 60, end = 84): PianoKey[] {
  const keys: PianoKey[] = [];
  let column = 0;
  for (let midi = start; midi <= end; midi += 1) {
    const pitchClass = midi % 12;
    const black = BLACK_PITCHES.has(pitchClass);
    if (!black) column += 1;
    const octave = Math.floor(midi / 12) - 1;
    const pitch = PITCHES[pitchClass];
    keys.push({
      midi,
      name: `${pitch}${octave}`,
      pitch,
      octave,
      frequency: 440 * 2 ** ((midi - 69) / 12),
      black,
      column,
    });
  }
  return keys;
}

const piano = pianoKeys();
const whiteKeyCount = piano.filter((key) => !key.black).length;

let sharedAudio: AudioContext | null = null;
let hammerNoise: AudioBuffer | null = null;

function audioContext() {
  const Ctx =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  try {
    sharedAudio ??= new Ctx();
    return sharedAudio;
  } catch {
    return null;
  }
}

function hammerBuffer(ctx: AudioContext) {
  if (hammerNoise && hammerNoise.sampleRate === ctx.sampleRate) return hammerNoise;
  const length = Math.floor(ctx.sampleRate * 0.04);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) {
    const fade = (1 - index / length) ** 2;
    data[index] = (Math.random() * 2 - 1) * fade;
  }
  hammerNoise = buffer;
  return buffer;
}

function playPianoNote(frequency: number) {
  const ctx = audioContext();
  if (!ctx) return;
  try {
    void ctx.resume().catch(() => {});
    soundPiano(ctx, frequency);
  } catch {
    // The key still lights if this browser cannot start audio.
  }
}

function soundPiano(ctx: AudioContext, frequency: number) {
  const now = ctx.currentTime;
  const output = ctx.createGain();
  output.gain.setValueAtTime(0.22, now);
  output.connect(ctx.destination);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(Math.min(frequency * 8, 8000), now);
  filter.frequency.exponentialRampToValueAtTime(
    Math.max(140, frequency * 2.4),
    now + 0.42,
  );
  filter.Q.value = 0.7;
  filter.connect(output);

  const partials: Array<[number, OscillatorType, number, number]> = [
    [1, 'triangle', 0.9, 1.28],
    [2, 'sine', 0.34, 0.86],
    [3, 'sine', 0.15, 0.5],
    [4.01, 'sine', 0.07, 0.32],
    [5.08, 'sine', 0.035, 0.2],
  ];
  for (const [ratio, type, level, decay] of partials) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency * ratio;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(level, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
    osc.connect(gain);
    gain.connect(filter);
    osc.start(now);
    osc.stop(now + decay + 0.04);
  }

  const noise = ctx.createBufferSource();
  noise.buffer = hammerBuffer(ctx);
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.value = 1600;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.1, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(output);
  noise.start(now);
  noise.stop(now + 0.05);
}

function PianoBoard() {
  const [heard, setHeard] = useState<PianoKey | null>(null);
  const struckAt = useRef(0);

  function strike(key: PianoKey) {
    playPianoNote(key.frequency);
    setHeard(key);
  }

  return (
    <section id="ai-piano" className="ai-piano" aria-label="钢琴键盘">
      <div className="ai-piano-bar">
      <Image
        src="/ai/piano-banner.jpg"
        alt="音乐与智能体远山横幅"
        width={1376}
        height={768}
      />
      </div>
      <div className="ai-piano-status">
        <span>PIANO / 01</span>
        <p className="ai-piano-readout">
          <span>琴键</span>
          <output aria-label="当前音符">
            {heard
              ? `${heard.name} · ${heard.frequency.toFixed(1)} Hz`
              : '点按弹奏'}
          </output>
        </p>
      </div>
      <fieldset className="ai-keys-scroll">
        <legend>钢琴键盘</legend>
        <div
          className="ai-keys"
          style={{
            gridTemplateColumns: `repeat(${whiteKeyCount}, minmax(0, 1fr))`,
          }}
        >
          {piano.map((key) => (
            <button
              key={key.midi}
              type="button"
              className={`ai-key ${key.black ? 'ai-key-black' : 'ai-key-white'}`}
              style={{ gridColumn: key.column }}
              aria-label={`${key.name} ${key.frequency.toFixed(1)} 赫兹`}
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                struckAt.current = performance.now();
                strike(key);
              }}
              onClick={() => {
                if (performance.now() - struckAt.current < 400) return;
                strike(key);
              }}
            >
              <span className="ai-key-name">
                {key.pitch === 'C' && !key.black ? key.name : key.pitch}
              </span>
            </button>
          ))}
        </div>
      </fieldset>
    </section>
  );
}

const STATUS_LABEL: Record<string, string> = {
  active: '已上线',
  beta: '公测中',
  coming: '即将推出',
};

/* ------------------------------------------------------------------ */
/*  01 · Agents                                                        */
/* ------------------------------------------------------------------ */

function AgentSection() {
  const agents = aiAgents;

  return (
    <section id="ai-agents" className="ai-section" aria-label="智能体 AI Agent">
      <div className="ai-agent-grid">
        {agents.map((agent) => (
          <article className="ai-agent-card" key={agent.id}>
            <div className="ai-agent-top">
              <span className="ai-agent-logo" aria-hidden="true">
                {agent.logo}
              </span>
              <span
                className={`ai-agent-status ai-status-${agent.status}`}
              >
                {STATUS_LABEL[agent.status] ?? agent.status}
              </span>
            </div>
            <h3>{agent.name}</h3>
            <p className="ai-agent-creator">by {agent.creator}</p>
            <p className="ai-agent-desc">{agent.description}</p>
            <div className="ai-agent-tags" aria-label="能力标签">
              {agent.tags.slice(0, 3).map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <a
              className="ai-resource-link"
              href={agent.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              项目主页 <ArrowUpRight size={16} />
            </a>
          </article>
        ))}
      </div>
      {!agents.length && (
        <p className="ai-empty">暂无智能体内容。</p>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  02 · Skills                                                        */
/* ------------------------------------------------------------------ */

function SkillsSection() {
  const [categoryFilter, setCategoryFilter] = useState('全部');
  const allCategories = useMemo(
    () => [...new Set(aiSkills.map((s) => s.category))],
    [],
  );
  const allSubcategories = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const s of aiSkills) {
      if (!map.has(s.category)) map.set(s.category, new Set());
      map.get(s.category)!.add(s.subcategory);
    }
    return map;
  }, []);

  const skills = aiSkills.filter(
    (skill) =>
      categoryFilter === '全部' ||
      skill.category === categoryFilter ||
      skill.subcategory === categoryFilter,
  );

  return (
    <section id="ai-skills" className="ai-section" aria-label="技能 Skills">
      <div className="ai-skill-categories" aria-label="技能分类">
        <button
          type="button"
          aria-pressed={categoryFilter === '全部'}
          onClick={() => setCategoryFilter('全部')}
        >
          全部
        </button>
        {allCategories.map((cat) => {
          const subs = allSubcategories.get(cat);
          return (
            <div className="ai-cat-group" key={cat}>
              <button
                type="button"
                aria-pressed={categoryFilter === cat}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat}
                {subs && subs.size > 1 && (
                  <ChevronDown size={13} className="ai-cat-chevron" />
                )}
              </button>
              {subs && subs.size > 1 && (
                <div className="ai-cat-submenu">
                  {[...subs].map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      aria-pressed={categoryFilter === sub}
                      onClick={() => setCategoryFilter(sub)}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="ai-skill-grid">
        {skills.map((skill) => (
          <article className="ai-skill-card" key={skill.id}>
            <div className="ai-skill-meta">
              <span className="ai-card-icon" aria-hidden="true">
                <Sparkles size={16} />
              </span>
              <span>{skill.category} / {skill.subcategory}</span>
            </div>
            <h3>{skill.title}</h3>
            <p>{skill.description}</p>
            <a
              className="ai-resource-link"
              href={skill.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              官方 Skill <ArrowUpRight size={16} />
            </a>
          </article>
        ))}
      </div>
      {!skills.length && (
        <p className="ai-empty">当前分类下暂无技能。</p>
      )}
      <p className="ai-source-note">
        收录自 Anthropic 官方技能库 · 适配环境与依赖见原仓库
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  03 · Relays                                                        */
/* ------------------------------------------------------------------ */

function RelaysSection() {
  const relays = aiRelays;
  const [failedLogos, setFailedLogos] = useState<string[]>([]);

  return (
    <section id="ai-relays" className="ai-section" aria-label="中转站 API">
      <div className="ai-relay-grid">
        {relays.map((relay) => (
          <article className="ai-relay-card" key={relay.id}>
            <div className="ai-relay-top">
              <span className="ai-relay-mark" aria-hidden="true">
                {failedLogos.includes(relay.id) ? relay.mark : (
                  <Image src={relay.logo} alt="" width={40} height={40} unoptimized onError={() => setFailedLogos((ids) => ids.includes(relay.id) ? ids : [...ids, relay.id])} />
                )}
              </span>
              <h3>{relay.name}</h3>
            </div>
            <p>{relay.description}</p>
            <div className="ai-relay-links">
              <a className="ai-relay-url" href={relay.href} title={relay.href} target="_blank" rel="noopener noreferrer">{relay.href}</a>
              <a className="ai-relay-go" href={relay.href} aria-label={`前往 ${relay.name}`} target="_blank" rel="noopener noreferrer">前往 <ArrowUpRight size={14} aria-hidden="true" /></a>
            </div>
          </article>
        ))}
      </div>
      {!relays.length && (
        <p className="ai-empty">暂无中转站推荐。</p>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Main notebook                                                      */
/* ------------------------------------------------------------------ */

export function AiNotebook() {
  const [active, setActive] = useState('ai-models');
  const [modelCount, setModelCount] = useState(0);

  const navigation = [
    {
      id: 'ai-models',
      name: '大模型数据',
      count: modelCount,
      icon: Database,
    },
    {
      id: 'ai-agents',
      name: '智能体',
      count: aiAgents.length,
      icon: Bot,
    },
    {
      id: 'ai-skills',
      name: '技能 Skills',
      count: aiSkills.length,
      icon: Puzzle,
    },
    {
      id: 'ai-relays',
      name: '中转站 API',
      count: aiRelays.length,
      icon: Network,
    },
  ];
  return (
    <Tabs.Root
      className="ai-notebook"
      value={active}
      onValueChange={(value) => setActive(String(value))}
    >
      <PianoBoard />
      <Tabs.List className="ai-tabs" aria-label="AI 栏目切换">
        {navigation.map((item) => (
          <Tabs.Tab value={item.id} key={item.id} aria-label={item.name}>
            <item.icon className="ai-tab-icon" size={17} strokeWidth={1.7} aria-hidden="true" />
            {item.name}
            <small>{String(item.count).padStart(2, '0')}</small>
          </Tabs.Tab>
        ))}
      </Tabs.List>

      <Tabs.Panel value="ai-models">
        <AiModelDataSection
          active={active === 'ai-models'}
          onModelCountChange={setModelCount}
        />
      </Tabs.Panel>

      <Tabs.Panel value="ai-agents">
        <AgentSection />
      </Tabs.Panel>

      <Tabs.Panel value="ai-skills">
        <SkillsSection />
      </Tabs.Panel>

      <Tabs.Panel value="ai-relays">
        <RelaysSection />
      </Tabs.Panel>

      <footer className="ai-field-footer">
        <div>
          <span className="ai-status-dot" />
          <p>下一次发现，也会留在这里。</p>
        </div>
        <a href="#ai-piano">回到开头 ↑</a>
      </footer>
    </Tabs.Root>
  );
}
