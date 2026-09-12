'use client';
import { AdminActivityManager } from './admin-activity-manager';
import { AdminBookManager } from './admin-book-manager';
import { migrateActivities } from '@/lib/activity-content';
import { migrateBooks } from '@/lib/book-content';
import { AdminPodcastManager } from './admin-podcast-manager';
import { migratePodcasts } from '@/lib/podcast-content';
import { AdminFilmManager } from './admin-film-manager';
import { migrateFilms } from '@/lib/film-content';
import { AdminMusicManager } from './admin-music-manager';
import { migrateMusic } from '@/lib/music-content';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Tabs } from '@base-ui/react/tabs';
import { createArticleCover, type Article } from './admin-writing-editor';
import { AdminDirectoryManager } from './admin-directory-manager';
import { migrateDirectory } from '@/lib/directory-content';
import { AdminProjectManager } from './admin-project-manager';
import { createProjectImage } from './admin-project-images';
import {
  migrateProjects,
  resolveProjects,
  projectImageInput,
} from '@/lib/project-content';
import { AdminWritingManager } from './admin-writing-manager';
import { AdminStoryManager } from './admin-story-manager';
import { migrateStories } from '@/lib/story-content';
import { AdminCategoryManager } from './admin-category-manager';
import { AdminAiSettings } from './admin-ai-settings';
import { coverInput, stripArticleExtras } from '@/lib/article-categories';
import {
  defaults,
  sectionLabels,
  type Content,
  type Section,
} from '@/lib/cms-defaults';
import type { Json } from '@/lib/cms-validation';
import { AdminPageEditor } from './admin-page-editor';
import {
  api,
  asJson,
  download,
  Field,
  fresh,
  MediaLibrary,
  titleOf,
} from './admin-fields';

const destinations: Partial<Record<Section, string>> = {
  home: '/',
  site: '/',
  writing: '/writing',
  projects: '/projects',
  stories: '/notes',
  slides: '/notes',
  profile: '/about',
  aiNotes: '/ai',
  prompt: '/ai',
  investing: '/investing',
  bookmarks: '/bookmarks',
  friends: '/friends',
  books: '/books',
  tracks: '/music',
  films: '/films',
  podcasts: '/podcasts',
  travel: '/travel',
  hobbies: '/hobbies',
};

const sidebarSections: {
  label?: string;
  sections: Section[];
}[] = [
  {
    sections: [
      'aiSettings',
      'pageSettings',
      'copy',
      'site',
      'home',
      'writing',
      'projects',
      'stories',
      'profile',
      'aiNotes',
      'prompt',
      'investing',
    ],
  },
  { label: '网站', sections: ['bookmarks', 'friends'] },
  {
    label: '生活',
    sections: [
      'tracks',
      'films',
      'podcasts',
      'travel',
      'hobbies',
      'books',
    ],
  },
];

export function AdminPanel() {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [password, setPassword] = useState('');
  const [content, setContent] = useState<Content | null>(null);
  const [revisions, setRevisions] = useState<Partial<Record<Section, number>>>(
    {},
  );
  const [section, setSection] = useState<Section>('writing');
  const [writingCache, setWritingCache] = useState<
    Partial<Record<Section, Json>>
  >({});
  const writingGroup = section === 'writing' || section === 'categories';
  const storyGroup = section === 'stories' || section === 'slides';
  const [draft, setDraft] = useState<Json>([]);
  const [selected, setSelected] = useState(0);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [requestBusy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const busy = requestBusy || generating;
  const [media, setMedia] = useState(false);
  const dirty =
    content !== null &&
    JSON.stringify(draft) !== JSON.stringify(content[section]);
  const unsaved =
    dirty ||
    (content !== null &&
      (writingGroup || storyGroup) &&
      Object.entries(writingCache).some(
        ([key, value]) =>
          key !== section &&
          JSON.stringify(value) !== JSON.stringify(content?.[key as Section]),
      ));
  const load = useCallback(async () => {
    const data = await api('/api/admin/content');
    setContent(data.content);
    setRevisions(data.revisions);
    setDraft(structuredClone(asJson(data.content[section])));
    setSelected(0);
    setWritingCache({});
    setLoggedIn(true);
  }, [section]);
  useEffect(() => {
    void (async () => {
      try {
        const session = await api('/api/admin/session');
        setConfigured(session.configured);
        if (session.authenticated) {
          const data = await api('/api/admin/content');
          setContent(data.content);
          setRevisions(data.revisions);
          setDraft(asJson(data.content.writing));
          setLoggedIn(true);
        }
      } catch (error) {
        setMessage(String(error));
      } finally {
        setReady(true);
      }
    })();
  }, []);
  useEffect(() => {
    const prevent = (event: BeforeUnloadEvent) => {
      if (unsaved) event.preventDefault();
    };
    window.addEventListener('beforeunload', prevent);
    return () => window.removeEventListener('beforeunload', prevent);
  }, [unsaved]);
  const discard = () =>
    !unsaved || window.confirm('有未保存的修改，确定放弃这些修改吗？');
  function choose(key: Section) {
    if (!content || (key === section && !media)) return;
    if (
      (writingGroup && (key === 'writing' || key === 'categories')) ||
      (storyGroup && (key === 'stories' || key === 'slides'))
    ) {
      setWritingCache((previous) => ({
        ...previous,
        [section]: structuredClone(draft),
      }));
      setDraft(structuredClone(writingCache[key] ?? asJson(content[key])));
      setSection(key);
      setMessage('');
      setMedia(false);
      return;
    }
    if (!discard()) return;
    setWritingCache({});
    setSection(key);
    setDraft(structuredClone(asJson(content[key])));
    setSelected(0);
    setQuery('');
    setMessage('');
    setMedia(false);
  }
  async function save() {
    setBusy(true);
    setMessage('');
    try {
      let savedDraft = structuredClone(draft);
      if (section === 'writing') {
        const articles = savedDraft as unknown as Article[];
        for (let i = 0; i < articles.length; i++) {
          const article = articles[i];
          if (
            article.coverMode === 'ai' &&
            (!article.cover ||
              article.coverGeneratedFor !==
                coverInput(article.title, article.excerpt))
          ) {
            setMessage(`正在为《${article.title}》生成封面，可能需要几分钟…`);
            articles[i] = await createArticleCover(article);
            setDraft(asJson(structuredClone(articles)));
          }
        }
        savedDraft = asJson(articles);
      }
      if (section === 'projects') {
        const projects = savedDraft as unknown as Content['projects'];
        for (const project of projects.items)
          for (let index = 0; index < project.images.length; index++) {
            const image = project.images[index];
            if (
              image.mode === 'ai' &&
              (!image.src || image.generatedFor !== projectImageInput(project))
            ) {
              setMessage(
                `正在为《${project.title}》生成第 ${index + 1} 张图片…`,
              );
              project.images[index] = await createProjectImage(project, image);
              setDraft(asJson(structuredClone(projects)));
            }
          }
        savedDraft = asJson(projects);
      }
      const result = await api('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: section,
          value: savedDraft,
          revision: revisions[section] ?? 0,
        }),
      });
      setContent((previous) => ({
        ...previous!,
        [section]: structuredClone(savedDraft),
      }));
      setRevisions((previous) => ({ ...previous, [section]: result.revision }));
      setDraft(savedDraft);
      setMessage('已保存。刷新前台页面即可查看已发布内容。');
    } catch (error) {
      setMessage(String(error));
    } finally {
      setBusy(false);
    }
  }
  if (!ready)
    return (
      <main className="admin-login">
        <output>正在连接内容管理…</output>
      </main>
    );
  if (!loggedIn)
    return (
      <main className="admin-login">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await api('/api/admin/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
              });
              setPassword('');
              await load();
              setMessage('');
            } catch (error) {
              setMessage(String(error));
            } finally {
              setBusy(false);
            }
          }}
        >
          <p className="admin-eyebrow">ALEI / CONTENT STUDIO</p>
          <h1>内容管理</h1>
          <p>在这里整理、编辑和发布你的博客。</p>
          {!configured && (
            <p className="admin-notice">
              首次使用：在项目目录运行 <code>npm run admin:password</code>
              ，再重启 <code>npm run dev</code>。命令会生成你的管理员密码。
            </p>
          )}
          <label htmlFor="admin-password">管理员密码</label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="admin-primary" disabled={busy || !configured}>
            {busy ? '登录中…' : '登录后台'}
          </button>
          <p role="alert">{message}</p>
          <Link href="/">← 返回博客</Link>
        </form>
      </main>
    );
  const list = Array.isArray(draft) ? draft : null;
  const template = asJson(defaults[section]);
  const record = list ? list[selected] : draft;
  const pageSection =
    section === 'pageSettings' || section === 'copy' ? section : null;
  const renderSectionButton = (key: Section, child = false) => (
    <button
      type="button"
      className={child ? 'admin-nav-child' : undefined}
      disabled={busy}
      key={key}
      aria-current={
        !media &&
        (section === key ||
          (key === 'writing' && writingGroup) ||
          (key === 'stories' && storyGroup))
          ? 'page'
          : undefined
      }
      onClick={() => choose(key)}
    >
      {sectionLabels[key]}
      {(key === 'projects' ||
        key === 'bookmarks' ||
        key === 'friends' ||
        key === 'tracks' ||
        key === 'films' || key === 'podcasts' || key === 'travel' || key === 'hobbies' || key === 'books') &&
        content && <small>{content[key].items.length}</small>}
      {Array.isArray(content?.[key]) && (
        <small>{(content[key] as unknown[]).length}</small>
      )}
    </button>
  );
  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/">
          A / 内容工作室
        </Link>
        <p>内容与页面</p>
        <nav aria-label="后台栏目">
          {sidebarSections.map((group, index) =>
            group.label ? (
              <div className="admin-nav-group" key={group.label}>
                <span className="admin-nav-group-label">{group.label}</span>
                <div>
                  {group.sections.map((key) => renderSectionButton(key, true))}
                </div>
              </div>
            ) : (
              <div className="admin-nav-primary" key={index}>
                {group.sections.map((key) => renderSectionButton(key))}
              </div>
            ),
          )}
        </nav>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (discard()) {
              setDraft(asJson(content![section]));
              setWritingCache({});
              setMedia(true);
            }
          }}
        >
          素材库 ↗
        </button>
        <a href="/" target="_blank" rel="noreferrer">
          打开博客 ↗
        </a>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            if (!discard()) return;
            try {
              await api('/api/admin/session', { method: 'DELETE' });
              setLoggedIn(false);
              setContent(null);
              setWritingCache({});
              setMessage('');
            } catch (error) {
              setMessage(String(error));
            }
          }}
        >
          退出登录
        </button>
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <div>
            <p className="admin-eyebrow">LOCAL BLOG / EDITOR</p>
            <h1>
              {media
                ? '素材管理'
                : writingGroup
                  ? '写作'
                  : storyGroup
                    ? '说说'
                    : sectionLabels[section]}
            </h1>
          </div>
          <div>
            <button
              type="button"
              onClick={() =>
                download(
                  {
                    format: 'alei-cms-v1',
                    exportedAt: new Date().toISOString(),
                    content: { ...content, [section]: draft },
                  },
                  'alei-content-backup.json',
                )
              }
            >
              导出内容备份
            </button>
            {!pageSection && (
              <a
                href={destinations[section] || '/'}
                target="_blank"
                rel="noreferrer"
              >
                查看前台 ↗
              </a>
            )}
          </div>
        </header>
        {media ? (
          <MediaLibrary />
        ) : (
          <>
            <div className="admin-toolbar">
              <span>
                {dirty ? '有未保存的修改' : '已与服务器同步'} · 版本{' '}
                {revisions[section] ?? 0}
              </span>
              <div>
                <label className="admin-file-button">
                  导入此栏目
                  <input
                    type="file"
                    disabled={busy}
                    accept="application/json,.json"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        if (file.size > 30000000)
                          throw new Error('备份文件过大');
                        const data = JSON.parse(await file.text());
                        let value =
                          data.format === 'alei-cms-v1'
                            ? data.content[section]
                            : data;
                        const { validateContent } =
                          await import('@/lib/cms-validation');
                        if (section === 'writing' && Array.isArray(value))
                          value = value.map(article => stripArticleExtras(article as object)) as Json;
                        if (section === 'projects')
                          value = Array.isArray(value)
                            ? migrateProjects(value)
                            : resolveProjects(value);
                        if (
                          (section === 'bookmarks' || section === 'friends') &&
                          Array.isArray(value)
                        )
                          value = migrateDirectory(value);
                        if (section === 'travel' || section === 'hobbies') value = asJson(migrateActivities(value as unknown as Content['travel']));
                        if (section === 'books') value = asJson(migrateBooks(value as unknown as Content['books']));
                        if (section === 'podcasts') value = asJson(migratePodcasts(value as unknown as Content['podcasts']));
                        if (section === 'films')
                          value = asJson(
                            migrateFilms(value as unknown as Content['films']),
                          );
                        if (section === 'tracks')
                          value = migrateMusic(
                            value as unknown as Content['tracks'],
                          ) as unknown as Json;
                        if (section === 'stories' && Array.isArray(value))
                          value = migrateStories(value);
                        validateContent(section, value);
                        if (discard()) {
                          setDraft(value);
                          setSelected(0);
                          setQuery('');
                          setMessage('已载入备份中的此栏目，请检查后保存。');
                        }
                      } catch (error) {
                        setMessage(String(error));
                      }
                      e.target.value = '';
                    }}
                  />
                </label>
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    if (!discard()) return;
                    try {
                      await load();
                      setMessage('已重新载入');
                    } catch (error) {
                      setMessage(String(error));
                    }
                  }}
                >
                  重新载入
                </button>
                <button
                  type="button"
                  className="admin-primary"
                  disabled={busy || !dirty}
                  onClick={() => void save()}
                >
                  {generating
                    ? '封面处理中…'
                    : requestBusy
                      ? '保存中…'
                      : section === 'writing' &&
                          (draft as unknown as Article[]).some(
                            (article) =>
                              article.coverMode === 'ai' &&
                              (!article.cover ||
                                article.coverGeneratedFor !==
                                  coverInput(article.title, article.excerpt)),
                          )
                        ? '生成封面并保存'
                        : '保存栏目'}
                </button>
              </div>
            </div>
            <output className="admin-status">
              {message ||
                (pageSection
                  ? '先选择页面，再编辑对应内容。页面之间可自由切换，修改统一保存。'
                  : section === 'aiSettings'
                    ? '保存模型和提示词设置后，可测试连接或到写作栏目生成封面。'
                    : section === 'categories'
                      ? '当前保存文章分类。先保存新分类，再切换文章管理使用；标签切换会保留修改。'
                      : section === 'writing'
                        ? '当前保存文章管理。切换到文章分类会保留修改；选择 AI 封面时会先生成再保存。'
                        : '修改后点击保存栏目。取消“发布到前台”可将条目转为草稿。')}
            </output>
            <div
              className={`admin-editor${list && !writingGroup && !storyGroup ? ' has-list' : ''}`}
            >
              <fieldset className="admin-editor-content" disabled={busy}>
                {writingGroup ? (
                  <Tabs.Root
                    className="admin-writing-tabs"
                    value={section}
                    onValueChange={(value) =>
                      choose(value as 'writing' | 'categories')
                    }
                  >
                    <Tabs.List
                      className="admin-settings-tabs"
                      aria-label="写作管理"
                    >
                      <Tabs.Tab value="writing">文章管理</Tabs.Tab>
                      <Tabs.Tab value="categories">文章分类</Tabs.Tab>
                    </Tabs.List>
                    <Tabs.Panel value="writing">
                      {section === 'writing' && (
                        <AdminWritingManager
                          articles={draft as unknown as Article[]}
                          categories={content!.categories}
                          busy={busy}
                          onWorking={setGenerating}
                          onChange={(next) => setDraft(asJson(next))}
                        />
                      )}
                    </Tabs.Panel>
                    <Tabs.Panel value="categories">
                      {section === 'categories' && (
                        <AdminCategoryManager
                          categories={draft as unknown as Content['categories']}
                          articles={content!.writing}
                          onChange={(next) => setDraft(asJson(next))}
                        />
                      )}
                    </Tabs.Panel>
                  </Tabs.Root>
                ) : storyGroup ? (
                  <Tabs.Root
                    className="admin-writing-tabs"
                    value={section}
                    onValueChange={(value) => choose(value as Section)}
                  >
                    <Tabs.List
                      className="admin-settings-tabs"
                      aria-label="说说管理"
                    >
                      <Tabs.Tab value="stories">说说列表</Tabs.Tab>
                      <Tabs.Tab value="slides">说说封面</Tabs.Tab>
                    </Tabs.List>
                    <p className="admin-story-tab-help">
                      切换标签保留修改；“保存栏目”保存当前标签的内容。
                    </p>
                    <Tabs.Panel value="stories">
                      {section === 'stories' && (
                        <AdminStoryManager
                          stories={draft as unknown as Content['stories']}
                          onChange={(next) => setDraft(asJson(next))}
                          onWorking={setGenerating}
                        />
                      )}
                    </Tabs.Panel>
                    <Tabs.Panel value="slides">
                      {section === 'slides' && (
                        <div className="admin-form">
                          <Field
                            path="slides"
                            label="说说封面"
                            value={draft}
                            sample={asJson(defaults.slides)}
                            onChange={setDraft}
                          />
                        </div>
                      )}
                    </Tabs.Panel>
                  </Tabs.Root>
                ) : section === 'projects' ? (
                  <AdminProjectManager
                    value={draft as unknown as Content['projects']}
                    onWorking={setGenerating}
                    onChange={(next) => setDraft(asJson(next))}
                  />
                ) : section === 'travel' || section === 'hobbies' ? (
                  <AdminActivityManager key={section} section={section} value={draft as unknown as Content['travel']} onChange={next => setDraft(asJson(next))} onWorking={setGenerating} />
                ) : section === 'books' ? (
                  <AdminBookManager value={draft as unknown as Content['books']} onChange={next => setDraft(asJson(next))} onWorking={setGenerating} />
                ) : section === 'podcasts' ? (
                  <AdminPodcastManager value={draft as unknown as Content['podcasts']} onChange={(next) => setDraft(asJson(next))} onWorking={setGenerating} />
                ) : section === 'films' ? (
                  <AdminFilmManager
                    value={draft as unknown as Content['films']}
                    onChange={(next) => setDraft(asJson(next))}
                    onWorking={setGenerating}
                  />
                ) : section === 'tracks' ? (
                  <AdminMusicManager
                    onWorking={setGenerating}
                    value={draft as unknown as Content['tracks']}
                    onChange={(next) => setDraft(asJson(next))}
                  />
                ) : section === 'bookmarks' || section === 'friends' ? (
                  <AdminDirectoryManager
                    key={section}
                    section={section}
                    value={draft as unknown as Content['bookmarks']}
                    onChange={(next) => setDraft(asJson(next))}
                  />
                ) : pageSection ? (
                  <AdminPageEditor
                    key={pageSection}
                    section={pageSection}
                    value={draft as Record<string, Json>}
                    sample={template as Record<string, Json>}
                    saved={
                      asJson(content![pageSection]) as Record<string, Json>
                    }
                    onChange={setDraft}
                  />
                ) : (
                  <>
                    {list && (
                      <aside className="admin-records">
                        <div className="admin-record-tools">
                          <input
                            type="search"
                            placeholder="搜索此栏目"
                            aria-label="搜索此栏目"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setDraft([
                                ...list,
                                fresh((template as Json[])[0]),
                              ]);
                              setSelected(list.length);
                              setQuery('');
                            }}
                          >
                            ＋ 新增
                          </button>
                        </div>
                        {list.map(
                          (item, index) =>
                            titleOf(item, index)
                              .toLowerCase()
                              .includes(query.toLowerCase()) && (
                              <button
                                className="admin-record"
                                type="button"
                                aria-pressed={selected === index}
                                key={index}
                                onClick={() => setSelected(index)}
                              >
                                <small>
                                  {String(index + 1).padStart(2, '0')} ·{' '}
                                  {item &&
                                  typeof item === 'object' &&
                                  !Array.isArray(item) &&
                                  item._published === false
                                    ? '草稿'
                                    : '已发布'}
                                </small>
                                <strong>{titleOf(item, index)}</strong>
                              </button>
                            ),
                        )}
                        {!list.length && <p>此栏目暂无内容。点击新增开始。</p>}
                      </aside>
                    )}
                    <section className="admin-form">
                      {record !== undefined ? (
                        <>
                          {list && (
                            <div className="admin-record-heading">
                              <h2>{titleOf(record, selected)}</h2>
                              <div>
                                {[-1, 1].map((direction) => (
                                  <button
                                    key={direction}
                                    type="button"
                                    disabled={
                                      selected + direction < 0 ||
                                      selected + direction >= list.length
                                    }
                                    onClick={() => {
                                      const items = [...list];
                                      [
                                        items[selected],
                                        items[selected + direction],
                                      ] = [
                                        items[selected + direction],
                                        items[selected],
                                      ];
                                      setDraft(items);
                                      setSelected(selected + direction);
                                    }}
                                  >
                                    {direction === -1 ? '上移' : '下移'}
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  className="admin-danger"
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        '删除这条内容？保存栏目后生效。',
                                      )
                                    ) {
                                      setDraft(
                                        list.filter((_, i) => i !== selected),
                                      );
                                      setSelected(Math.max(0, selected - 1));
                                    }
                                  }}
                                >
                                  删除
                                </button>
                              </div>
                            </div>
                          )}
                          {section === 'aiSettings' ? (
                            <AdminAiSettings
                              value={record as unknown as Content['aiSettings']}
                              dirty={dirty}
                              onChange={(next) => setDraft(asJson(next))}
                            />
                          ) : (
                            <Field
                              key={`${section}-${selected}`}
                              path={section}
                              label={sectionLabels[section]}
                              sample={list ? (template as Json[])[0] : template}
                              value={record}
                              onChange={(next) =>
                                setDraft(
                                  list
                                    ? list.map((old, i) =>
                                        i === selected ? next : old,
                                      )
                                    : next,
                                )
                              }
                            />
                          )}
                        </>
                      ) : (
                        <p>新增内容，或选择左侧条目开始编辑。</p>
                      )}
                    </section>
                  </>
                )}
              </fieldset>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
