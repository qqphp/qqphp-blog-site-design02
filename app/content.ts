export type Entry = { title: string; excerpt: string; date: string; label: string; meta: string; tag: string; category: string; cover: string };

export const writing: Entry[] = [
  { title: '把复杂问题，做成能被感知的界面', excerpt: '好的界面不止降低操作成本，也让人更快看见问题本身。', date: '2026.09.03', label: '产品思考', meta: '8 分钟阅读', tag: '体验设计', category: '产品与体验', cover: '/covers/writing-clarity.png' },
  { title: '一个工作流，应该从哪里开始变得顺手', excerpt: '不从工具清单开始，而从那些反复发生、又总被打断的瞬间开始。', date: '2026.08.19', label: '工作方法', meta: '6 分钟阅读', tag: '系统', category: '工作与方法', cover: '/covers/writing-system.png' },
  { title: '留白不是空白：内容密度的另一种组织方式', excerpt: '信息足够多时，节奏反而比元素更多更重要。', date: '2026.07.27', label: '设计笔记', meta: '5 分钟阅读', tag: '编辑设计', category: '设计与表达', cover: '/covers/writing-notes.png' },
  { title: '为长期内容建立一个不急于结论的容器', excerpt: '让未完成的观察也可以被记录、连接与重新使用。', date: '2026.07.02', label: '写作', meta: '10 分钟阅读', tag: '创作', category: '工作与方法', cover: '/covers/writing-system.png' },
  { title: '当项目进入第二年，哪些东西值得重做', excerpt: '重做并不意味着推翻，常常只是把已经验证的部分摆回正确的位置。', date: '2026.06.12', label: '项目复盘', meta: '7 分钟阅读', tag: '迭代', category: '产品与体验', cover: '/covers/writing-clarity.png' },
];

export const projects = [
  { number: '01', title: '开放式工作档案', category: '内容系统 / 视觉与交互', year: '2026 — 进行中', description: '一个让项目、文章与过程碎片彼此连接的个人发布实验。', status: '持续迭代', color: 'a', github: 'github.com/your-name/open-work-archive', role: '内容策略、体验结构、视觉设计', detail: '面向长期积累的个人内容系统。它把文章、说说、项目与链接组织为可以互相跳转的档案。', images: ['/projects/archive.png', '/projects/reading.png', '/projects/signals.png'] },
  { number: '02', title: '慢速阅读界面', category: '编辑体验 / 原型探索', year: '2026', description: '围绕长文阅读节奏、批注与回看路径的一组界面研究。', status: '概念研究', color: 'b', github: 'github.com/your-name/slow-reading', role: '交互原型、阅读体验', detail: '探索长文如何在屏幕上保有节奏：章节锚点、留白、批注与读后回看被重新组合。', images: ['/projects/reading.png', '/projects/archive.png', '/projects/signals.png'] },
  { number: '03', title: '日常信号收集器', category: '个人工具 / 信息整理', year: '2025 — 2026', description: '把零散灵感转化成可回溯线索的轻量工作流。', status: '内部使用', color: 'c', github: 'github.com/your-name/signal-catcher', role: '产品定义、信息架构', detail: '将碎片化输入收束为可检索、可关联的日常信号，减少灵感在不同工具之间流失。', images: ['/projects/signals.png', '/projects/archive.png', '/projects/reading.png'] },
];

export const stories = [
  { date: '今天 10:42', text: '把「笔记」改成「说说」之后，内容不再需要等到完整才出现。一个项目中的疑问、一张截图背后的判断，都可以先留在这里。', topic: '正在更新这个站点', reactions: '12 人觉得有用', replies: ['把过程留下来，比只展示结果更有意思。', '期待看到这套内容慢慢长起来。'] },
  { date: '昨天 18:16', text: '最近反复确认一件事：真正节省时间的不是更快地做完，而是让下一次能少从头理解一遍。', topic: '工作记录', reactions: '8 个赞', replies: ['这也是我开始写工作日志的原因。'] },
  { date: '09 月 01 日', text: '今天整理了几条没有被采用的页面方案。它们没有失效，只是还没有等到适合的问题。', topic: '设计碎片', reactions: '16 个赞', replies: ['被保留的备选方案以后往往很有用。', '很喜欢这个说法。'] },
];
