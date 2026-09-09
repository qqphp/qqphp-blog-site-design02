import { migrateDirectory } from './directory-content';
import { writing, stories } from '../app/content';
import { migrateProjects } from './project-content';
import { showcaseProjects } from './project-showcase';
import { profile } from './profile';
import { bookmarks, friends } from './directory-data';
import { books, booklists } from './books';
import { tracks } from './music';
import { lifeContent } from './life-content';
import { aiNotes, promptRecipe } from './ai-notebook';
import { researchContent } from './research-content';
import pageCopy from './page-copy.json';
import articleSeed from './article-seed.json';
import { categoryId } from './article-categories';

const publish = <T extends object>(items: T[]) =>
  items.map((item) => ({ ...item, _published: true }));
export const defaults = {
  aiSettings: {
    projectImageStyle:
      '清晰的产品概念插画，简洁构图，突出项目核心用途，与博客视觉协调，横向构图。',
    projectImagePrompt:
      '为以下项目生成一张横向封面图。\n项目名称：{{title}}\n副标题：{{subtitle}}\n摘要：{{excerpt}}\n视觉风格：{{style}}\n用具体的物件、场景与空间关系表达项目用途，保持一个视觉焦点，留出裁切余量。不要文字、标志或水印。',
    baseUrl: 'https://api.teamorouter.com/v1',
    textModel: 'gpt-5.4-mini',
    imageModel: 'gpt-image-2',
    coverStyle:
      '现代编辑插画，简洁构图，温暖纸张质感，墨绿与米白为主色，少量暖金色点缀',
    coverPrompt:
      '为一篇中文博客文章创作横向封面插画。\n文章标题：{{title}}\n文章摘要：{{excerpt}}\n视觉风格：{{style}}\n请提炼文章的核心概念，用具象物件与空间关系表达，避免通用机器人、发光大脑和杂乱科技符号。画面有一个明确视觉焦点，边缘保留裁切余量。不要出现文字、字母、数字、标志、水印。横向 3:2 构图，适合博客文章列表与分享封面。',
  },
  categories: [...new Set(writing.map((item) => item.category))].map(
    (name) => ({ id: categoryId(name), name, description: '', parentId: '' }),
  ),
  pageSettings: {
    writing: {
      title: '记录思考，分享实践。',
      text: '分享实践中的经验、方法与观察，也记录那些值得继续探讨的问题。',
    },
    projects: {
      title: '从一个想法，到一件作品。',
      text: '收录产品原型、设计探索与个人工具，记录每个项目的构思、实现与迭代。',
    },
    aiCover: {
      src: '/notes/paper-v2.png',
      alt: '本站说说封面的 AI 纸艺山水实验',
      href: '#ai-note-cover',
    },
    travelCover: { src: '/stories-coast.png', alt: '旅行栏目示例海岸景观' },
    films: {
      description: '四个虚构短片的故事提案，从城市、生活、声音到实验影像。',
    },
    podcasts: {
      description:
        '四篇虚构对话文字稿，从创作、技术聊到阅读与日常。暂未提供节目音频。',
    },
    travel: { description: '三条想象中的路线，收集海风、水面与树影。' },
    hobbies: { description: '从五分钟开始，在写字、摄影和聆听里找回手感。' },
    investing: {
      eyebrow: '从观察到验证',
      title: '把判断，写成可以复查的过程。',
      steps: ['趋势观察', '指标定义', '策略假设', '验证复盘'],
      description: '趋势、指标、量化与复盘，保留每一步的上下文。',
      note: '研究示例 · 无实时行情或回测收益',
      disclosure:
        '本页为投资研究框架示例，仅用于学习与交流，不构成投资建议。未接入行情、账户或交易系统。',
    },
  },
  copy: pageCopy,
  site: {
    name: '开发阿雷',
    mark: 'A',
    title: '开发阿雷 · 个人工作站',
    description: '写作、项目与持续生长的工作档案。',
    footer: '保持好奇，缓慢积累。',
    copyright: '© 2026 · 开发阿雷',
    footerLink: '保持联系 ↗',
    footerUrl: '/about#profile-contact',
    links: [
      { name: '写作', href: '/writing' },
      { name: '项目', href: '/projects' },
      { name: '说说', href: '/notes' },
      { name: 'AI', href: '/ai' },
      { name: '投资', href: '/investing' },
      { name: '关于', href: '/about' },
    ],
    sites: [
      { name: '书签', href: '/bookmarks' },
      { name: '友链', href: '/friends' },
    ],
    life: [
      { name: '音乐', href: '/music' },
      { name: '电影', href: '/films' },
      { name: '播客', href: '/podcasts' },
      { name: '旅行', href: '/travel' },
      { name: '爱好', href: '/hobbies' },
      { name: '书籍', href: '/books' },
    ],
  },
  home: {
    eyebrow: 'PERSONAL WORKSTATION / 2026',
    title: '思考、制作，\n并留下值得回看的东西。',
    description:
      '这里存放我的写作、项目与尚未成形的灵感。\n欢迎从最近的更新开始。',
    noteTitle: '不是所有内容都需要成为文章。',
    noteText:
      '说说记录正在形成的想法、值得再次查看的素材，以及尚未适合被归类的问题。',
  },
  writing: publish(
    writing.map((item) => ({
      ...item,
      body: articleSeed,
      categoryId: categoryId(item.category),
      coverMode: 'upload',
      coverGeneratedFor: '',
    })),
  ),
  projects: migrateProjects(showcaseProjects),
  stories: publish(
    stories.map((item, index) => ({
      date: item.date,
      text: item.text,
      topics: [item.topic],
      id: `story-${index + 1}`,
      images:
        index === 0
          ? [
              { src: '/stories-lake.png', alt: '晨雾中的山湖' },
              { src: '/stories-coast.png', alt: '海岸悬崖步道' },
              { src: '/stories-stream.png', alt: '秋叶与溪流' },
            ]
          : ([] as { src: string; alt: string }[]),
    })),
  ),
  slides: publish([
    {
      src: '/notes/paper-v2.png',
      title: '纸上远山',
      alt: 'AI 生成的纸艺山水与松林',
      width: 1881,
      height: 836,
      position: 'center 55%',
    },
    {
      src: '/notes/rain-v2.png',
      title: '雨夜河畔',
      alt: 'AI 生成的胶片风格雨夜河畔',
      width: 1935,
      height: 813,
      position: 'center 60%',
    },
    {
      src: '/notes/clay-v2.png',
      title: '柔软小世界',
      alt: 'AI 生成的黏土小屋与彩色树林',
      width: 1942,
      height: 809,
      position: 'center 60%',
    },
  ]),
  profile,
  aiNotes: publish(
    aiNotes.map((item) => ({
      ...item,
      href: item.href ?? '',
      link: item.link ?? '',
    })),
  ),
  prompt: { text: promptRecipe },
  investing: {
    ...researchContent.investing,
    sections: researchContent.investing.sections.map((section) => ({
      ...section,
      entries: publish(section.entries),
    })),
  },
  bookmarks: migrateDirectory(bookmarks),
  friends: migrateDirectory(friends),
  books: publish(books),
  booklists: publish(booklists),
  tracks: publish(tracks),
  films: { ...lifeContent.films, entries: publish(lifeContent.films.entries) },
  podcasts: {
    ...lifeContent.podcasts,
    entries: publish(lifeContent.podcasts.entries),
  },
  travel: {
    ...lifeContent.travel,
    entries: publish(
      lifeContent.travel.entries.map((item) => ({
        ...item,
        image: item.image ?? '',
      })),
    ),
  },
  hobbies: {
    ...lifeContent.hobbies,
    entries: publish(lifeContent.hobbies.entries),
  },
};
export type Content = typeof defaults;
export type PublicContent = Omit<Content, 'aiSettings'>;
export type Section = keyof Content;
export const sectionLabels: Record<Section, string> = {
  aiSettings: 'AI 大模型设置',
  pageSettings: '页面标题与配图',
  copy: '页面固定文案',
  site: '站点与导航',
  home: '首页',
  writing: '写作',
  categories: '文章分类',
  projects: '项目',
  stories: '说说',
  slides: '说说封面',
  profile: '关于',
  aiNotes: 'AI 手记',
  prompt: '提示词便签',
  investing: '投资研究',
  bookmarks: '书签',
  friends: '友链',
  books: '书籍',
  booklists: '主题书单',
  tracks: '音乐',
  films: '电影',
  podcasts: '播客',
  travel: '旅行',
  hobbies: '爱好',
};
