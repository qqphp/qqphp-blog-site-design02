export type Bookmark = { name: string; url: string; category: string; description: string; tags: string[] };

// 示例收藏；分类与数量由数据自动生成。
export const bookmarks: Bookmark[] = [
  { name: 'MDN Web Docs', url: 'https://developer.mozilla.org/zh-CN/', category: '开发与技术', description: '查阅 HTML、CSS 和 JavaScript 的基础与用法。', tags: ['文档', '前端'] },
  { name: 'web.dev', url: 'https://web.dev/', category: '开发与技术', description: '围绕性能、无障碍和现代 Web 的学习资料。', tags: ['Web', '性能'] },
  { name: 'GitHub', url: 'https://github.com/', category: '开发与技术', description: '从源代码、讨论与协作中了解一个项目。', tags: ['开源', '代码'] },
  { name: 'TypeScript', url: 'https://www.typescriptlang.org/docs/', category: '开发与技术', description: '类型系统、语言手册与实际代码示例。', tags: ['文档', '类型'] },
  { name: 'React', url: 'https://react.dev/', category: '开发与技术', description: '通过交互式示例学习组件与界面开发。', tags: ['前端', '文档'] },
  { name: 'A List Apart', url: 'https://alistapart.com/', category: '设计与体验', description: '关于网页设计、内容与构建方式的长文。', tags: ['设计', '阅读'] },
  { name: 'Nielsen Norman Group', url: 'https://www.nngroup.com/articles/', category: '设计与体验', description: '用户研究与交互设计的文章资料库。', tags: ['UX', '研究'] },
  { name: 'Material Design', url: 'https://m3.material.io/', category: '设计与体验', description: '组件、色彩与交互的设计系统参考。', tags: ['组件', '规范'] },
  { name: 'Are.na', url: 'https://www.are.na/', category: '设计与体验', description: '用主题集合连接图像、文字和创作线索。', tags: ['灵感', '收藏'] },
  { name: 'The Marginalian', url: 'https://www.themarginalian.org/', category: '写作与阅读', description: '文学、艺术与科学之间的阅读札记。', tags: ['人文', '随笔'] },
  { name: 'Works in Progress', url: 'https://worksinprogress.co/', category: '写作与阅读', description: '关于进步、技术与社会议题的长篇阅读。', tags: ['长文', '观点'] },
  { name: 'Project Gutenberg', url: 'https://www.gutenberg.org/', category: '写作与阅读', description: '寻找公版电子书与经典作品。', tags: ['电子书', '文学'] },
  { name: 'Hacker News', url: 'https://news.ycombinator.com/', category: '写作与阅读', description: '技术社区的链接分享与讨论。', tags: ['社区', '技术'] },
  { name: 'Hugging Face', url: 'https://huggingface.co/', category: 'AI 与研究', description: '探索模型、数据集与社区演示。', tags: ['模型', '开源'] },
  { name: 'arXiv', url: 'https://arxiv.org/', category: 'AI 与研究', description: '按研究领域查找预印本论文。', tags: ['论文', '学术'] },
  { name: 'Distill', url: 'https://distill.pub/', category: 'AI 与研究', description: '借助可视化理解机器学习概念的文章存档。', tags: ['可视化', '机器学习'] },
  { name: 'Google Fonts', url: 'https://fonts.google.com/', category: '工具与素材', description: '浏览字体家族，比较字形与排版效果。', tags: ['字体', '排版'] },
  { name: 'Lucide', url: 'https://lucide.dev/', category: '工具与素材', description: '查找风格统一的开源线性图标。', tags: ['图标', '开源'] },
  { name: 'Squoosh', url: 'https://squoosh.app/', category: '工具与素材', description: '在浏览器中压缩图片并比较格式。', tags: ['图片', '效率'] },
  { name: 'Excalidraw', url: 'https://excalidraw.com/', category: '工具与素材', description: '用手绘风格的白板整理思路与流程。', tags: ['白板', '绘图'] },
  { name: 'Internet Archive', url: 'https://archive.org/', category: '文化与探索', description: '在网页、书籍和影音档案中漫游。', tags: ['档案', '文化'] },
  { name: 'NASA', url: 'https://www.nasa.gov/', category: '文化与探索', description: '从太空影像与探索故事中打开视野。', tags: ['科学', '太空'] },
  { name: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/', category: '文化与探索', description: '探索共享媒体，使用前查看各自许可。', tags: ['影像', '百科'] },
  { name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/', category: '文化与探索', description: '在开放地图中寻找街道、城市与远方。', tags: ['地图', '旅行'] },
];

export type Friend = { name: string; category: string; description: string; initials: string; url?: string };

// 虚构展示资料。填入真实网址后，卡片才出现访问入口。
export const friends: Friend[] = [
  { name: '未完待续', category: '设计', description: '设计、阅读，以及尚未完成的日常。', initials: '未' },
  { name: '折叠的地图', category: '写作', description: '在文字里记录走过的路与遇见的人。', initials: '折' },
  { name: '低频信号', category: '技术', description: '从一个小问题开始，慢慢理解技术。', initials: '低' },
  { name: '窗边工作室', category: '设计', description: '关于字形、纸张和视觉秩序的练习。', initials: '窗' },
  { name: '山间来信', category: '生活', description: '散步、做饭，把普通日子认真记下来。', initials: '山' },
  { name: '像素之外', category: '技术', description: '写代码，也关心屏幕另一边的人。', initials: '像' },
  { name: '慢速快门', category: '摄影', description: '用影像留住城市里不起眼的光。', initials: '慢' },
  { name: '纸上漫游', category: '写作', description: '读书时的折角，生活里的旁注。', initials: '纸' },
  { name: '小小实验室', category: '技术', description: '工具、小作品，以及试错的过程。', initials: '小' },
  { name: '日光切片', category: '摄影', description: '观察季节如何经过同一扇窗。', initials: '日' },
  { name: '留白之间', category: '设计', description: '收集那些安静而准确的设计。', initials: '留' },
  { name: '周末岛屿', category: '生活', description: '给爱好和没有计划的时间留个位置。', initials: '周' },
];
